from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio
import os
import json
from datetime import datetime
from dotenv import load_dotenv

from . import crud, schemas
from .database import get_db, create_tables
from .github_service import GitHubService
from .websocket_manager import websocket_manager

load_dotenv()

app = FastAPI(
    title="Star Repo Search API",
    description="API for searching GitHub starred repositories",
    version="1.0.0"
)

# CORS配置
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建数据库表
create_tables()

# 全局变量用于跟踪同步状态
sync_status = {
    "is_syncing": False,
    "last_sync": None,
    "total_repos": 0,
    "message": "Ready to sync"
}


@app.get("/")
async def root():
    """根路径"""
    return {"message": "Star Repo Search API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


@app.websocket("/ws/sync")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点，用于实时同步状态推送"""
    await websocket_manager.connect(websocket)
    try:
        # 发送当前同步状态
        initial_message = {
            "type": "sync_status",
            "data": sync_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(initial_message, default=str))
        
        # 保持连接活跃
        while True:
            # 等待客户端消息（心跳包等）
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # 可以处理客户端发送的消息，比如心跳包
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # 发送心跳包
                heartbeat = {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await websocket.send_text(json.dumps(heartbeat))
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)


@app.post("/sync", response_model=schemas.SyncStatus)
async def sync_starred_repos(
    background_tasks: BackgroundTasks,
    username: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """同步GitHub starred仓库"""
    if sync_status["is_syncing"]:
        raise HTTPException(status_code=409, detail="Sync is already in progress")
    
    background_tasks.add_task(sync_repos_background, username, db)
    
    sync_status["is_syncing"] = True
    sync_status["message"] = "Sync started"
    
    return schemas.SyncStatus(**sync_status)


async def sync_repos_background(username: Optional[str], db: Session):
    """后台同步任务"""
    try:
        sync_status["is_syncing"] = True
        sync_status["message"] = "Fetching repositories from GitHub..."
        
        # 广播同步开始状态
        await websocket_manager.broadcast_sync_status(sync_status)
        
        github_service = GitHubService()
        repos_data = await github_service.get_starred_repos(username)
        
        sync_status["message"] = f"Saving {len(repos_data)} repositories to database..."
        await websocket_manager.broadcast_sync_status(sync_status)
        
        # 转换为StarredRepoCreate对象列表
        repo_creates = [schemas.StarredRepoCreate(**repo_data) for repo_data in repos_data]
        
        # 使用高性能批量插入/更新，每批500条记录
        total_repos = len(repo_creates)
        batch_size = 500
        
        for i in range(0, total_repos, batch_size):
            batch = repo_creates[i:i + batch_size]
            current_batch = i // batch_size + 1
            total_batches = (total_repos + batch_size - 1) // batch_size
            
            # 广播进度
            await websocket_manager.broadcast_sync_progress(
                current=i + len(batch),
                total=total_repos,
                message=f"Processing batch {current_batch}/{total_batches} ({len(batch)} repositories)"
            )
            
            # 处理当前批次
            crud.bulk_upsert_starred_repos_fast(db, batch, batch_size=len(batch))
        
        # 获取最终结果
        result = {"total_processed": total_repos, "created": 0, "updated": total_repos}
        
        sync_status["last_sync"] = datetime.utcnow()
        sync_status["total_repos"] = result["total_processed"]
        sync_status["message"] = f"Successfully synced {result['total_processed']} repositories"
        
        # 广播完成状态
        await websocket_manager.broadcast_sync_status(sync_status)
        
    except Exception as e:
        sync_status["message"] = f"Sync failed: {str(e)}"
        await websocket_manager.broadcast_sync_status(sync_status)
    finally:
        sync_status["is_syncing"] = False
        await websocket_manager.broadcast_sync_status(sync_status)


@app.get("/repos/search", response_model=schemas.SearchResponse)
async def search_repos(
    query: Optional[str] = None,
    language: Optional[str] = None,
    owner: Optional[str] = None,
    min_stars: Optional[int] = None,
    max_stars: Optional[int] = None,
    starred_after: Optional[str] = None,
    starred_before: Optional[str] = None,
    has_topics: Optional[bool] = None,
    is_fork: Optional[bool] = None,
    sort_by: str = 'starred_at',
    sort_order: str = 'desc',
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db)
):
    """搜索starred仓库"""
    if per_page > 100:
        per_page = 100
    
    repos, total = crud.search_repos(
        db=db,
        query=query,
        language=language,
        owner=owner,
        min_stars=min_stars,
        max_stars=max_stars,
        starred_after=starred_after,
        starred_before=starred_before,
        has_topics=has_topics,
        is_fork=is_fork,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        per_page=per_page
    )
    
    total_pages = (total + per_page - 1) // per_page
    
    return schemas.SearchResponse(
        repos=repos,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@app.get("/repos/{repo_id}", response_model=schemas.StarredRepo)
async def get_repo(repo_id: int, db: Session = Depends(get_db)):
    """根据ID获取仓库详情"""
    repo = crud.get_repo_by_repo_id(db, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo


@app.get("/languages", response_model=List[str])
async def get_languages(db: Session = Depends(get_db)):
    """获取所有编程语言列表"""
    return crud.get_all_languages(db)


@app.get("/owners", response_model=List[str])
async def get_owners(db: Session = Depends(get_db)):
    """获取所有仓库所有者列表"""
    return crud.get_all_owners(db)


@app.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """获取仓库统计信息"""
    return crud.get_repo_stats(db)


@app.delete("/repos")
async def delete_all_repos(db: Session = Depends(get_db)):
    """删除所有仓库记录"""
    count = crud.delete_all_repos(db)
    return {"message": f"Deleted {count} repositories"}


@app.get("/github/rate-limit")
async def get_github_rate_limit():
    """获取GitHub API速率限制信息"""
    try:
        github_service = GitHubService()
        rate_limit = await github_service.check_rate_limit()
        return rate_limit
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/github/user")
async def get_github_user():
    """获取GitHub用户信息"""
    try:
        github_service = GitHubService()
        user_info = await github_service.get_user_info()
        return user_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 