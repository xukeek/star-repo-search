import asyncio
import logging
import re
from typing import Optional, Dict, List
from sqlalchemy.orm import Session
import httpx
from datetime import datetime

from .database import get_db, RepoReadme, StarredRepo
from .vector_service import vector_service, get_content_hash
from .github_service import GitHubService

logger = logging.getLogger(__name__)


class ReadmeService:
    """README处理服务"""
    
    def __init__(self):
        self.github_service = GitHubService()
    
    async def get_readme_content(self, owner: str, repo: str, branch: str = "main") -> Optional[str]:
        """从GitHub获取README内容"""
        try:
            # 尝试常见的README文件名
            readme_files = [
                "README.md", "readme.md", "Readme.md",
                "README.rst", "readme.rst", "Readme.rst",
                "README.txt", "readme.txt", "Readme.txt",
                "README", "readme", "Readme"
            ]
            
            for readme_file in readme_files:
                try:
                    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{readme_file}"
                    headers = self.github_service._get_headers()
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.get(url, headers=headers)
                        
                        logger.debug(f"请求 {url} 返回状态码: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("type") == "file" and data.get("content"):
                                # 解码base64内容
                                import base64
                                content = base64.b64decode(data["content"]).decode('utf-8', errors='ignore')
                                logger.info(f"成功获取 {owner}/{repo} 的 {readme_file}")
                                return self._clean_readme_content(content)
                        elif response.status_code == 404:
                            logger.debug(f"{owner}/{repo} 中不存在 {readme_file}")
                        elif response.status_code == 403:
                            logger.warning(f"访问 {owner}/{repo} 的 {readme_file} 被拒绝 (403)")
                            # 如果是403错误，可能是私有仓库或API限制
                            break
                        elif response.status_code == 401:
                            logger.error(f"GitHub API认证失败 (401)")
                            break
                        else:
                            logger.warning(f"获取 {readme_file} 失败，状态码: {response.status_code}")
                                
                except Exception as e:
                    logger.debug(f"尝试获取 {readme_file} 失败: {e}")
                    continue
            
            logger.warning(f"未找到 {owner}/{repo} 的README文件")
            return None
            
        except Exception as e:
            logger.error(f"获取README内容失败 {owner}/{repo}: {e}")
            return None
    
    def _clean_readme_content(self, content: str) -> str:
        """清理README内容"""
        if not content:
            return ""
        
        # 移除过多的空行
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        # 移除HTML标签（保留基本格式）
        content = re.sub(r'<[^>]+>', '', content)
        
        # 限制长度（避免向量化时内容过长）
        max_length = 8000  # 约8K字符
        if len(content) > max_length:
            content = content[:max_length] + "..."
        
        return content.strip()
    
    async def process_repo_readme(self, db: Session, repo: StarredRepo) -> bool:
        """处理单个仓库的README"""
        try:
            # 获取README内容
            readme_content = await self.get_readme_content(
                repo.owner_login, 
                repo.name, 
                repo.default_branch or "main"
            )
            
            if not readme_content:
                logger.info(f"仓库 {repo.full_name} 没有README文件")
                return False
            
            # 计算内容哈希
            content_hash = get_content_hash(readme_content)
            
            # 检查是否已存在
            existing_readme = db.query(RepoReadme).filter(
                RepoReadme.repo_id == repo.repo_id
            ).first()
            
            if existing_readme:
                # 检查内容是否有变化
                if existing_readme.content_hash == content_hash:
                    logger.info(f"仓库 {repo.full_name} 的README内容未变化，跳过处理")
                    return True
                
                # 更新现有记录
                logger.info(f"更新仓库 {repo.full_name} 的README内容")
                
                # 更新向量数据库
                embedding_id = vector_service.update_readme(
                    repo.repo_id, 
                    readme_content,
                    metadata={
                        "repo_name": repo.name,
                        "full_name": repo.full_name,
                        "language": repo.language,
                        "stars": repo.stargazers_count,
                        "description": repo.description or ""
                    }
                )
                
                # 更新数据库记录
                existing_readme.content = readme_content
                existing_readme.content_hash = content_hash
                existing_readme.embedding_id = embedding_id
                existing_readme.updated_at = datetime.utcnow()
                
            else:
                # 创建新记录
                logger.info(f"处理仓库 {repo.full_name} 的README内容")
                
                # 添加到向量数据库
                embedding_id = vector_service.add_readme(
                    repo.repo_id, 
                    readme_content,
                    metadata={
                        "repo_name": repo.name,
                        "full_name": repo.full_name,
                        "language": repo.language,
                        "stars": repo.stargazers_count,
                        "description": repo.description or ""
                    }
                )
                
                # 创建数据库记录
                readme_record = RepoReadme(
                    repo_id=repo.repo_id,
                    content=readme_content,
                    content_hash=content_hash,
                    embedding_id=embedding_id
                )
                db.add(readme_record)
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"处理仓库 {repo.full_name} 的README失败: {e}")
            db.rollback()
            return False
    
    async def batch_process_readmes(self, db: Session, batch_size: int = 10, max_repos: Optional[int] = None):
        """批量处理README"""
        try:
            # 获取需要处理的仓库
            query = db.query(StarredRepo)
            if max_repos:
                query = query.limit(max_repos)
            
            repos = query.all()
            total_repos = len(repos)
            
            logger.info(f"开始批量处理 {total_repos} 个仓库的README")
            
            processed = 0
            success_count = 0
            
            # 分批处理
            for i in range(0, total_repos, batch_size):
                batch = repos[i:i + batch_size]
                
                # 并发处理当前批次
                tasks = []
                for repo in batch:
                    task = self.process_repo_readme(db, repo)
                    tasks.append(task)
                
                # 等待当前批次完成
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # 统计结果
                for result in results:
                    processed += 1
                    if isinstance(result, bool) and result:
                        success_count += 1
                
                logger.info(f"已处理 {processed}/{total_repos} 个仓库，成功 {success_count} 个")
                
                # 避免API限制，添加延迟
                if i + batch_size < total_repos:
                    await asyncio.sleep(1)
            
            logger.info(f"批量处理完成：总计 {total_repos} 个，成功 {success_count} 个")
            return {"total": total_repos, "success": success_count, "failed": total_repos - success_count}
            
        except Exception as e:
            logger.error(f"批量处理README失败: {e}")
            raise
    
    def get_readme_stats(self, db: Session) -> Dict:
        """获取README处理统计信息"""
        try:
            total_repos = db.query(StarredRepo).count()
            processed_repos = db.query(RepoReadme).count()
            vector_stats = vector_service.get_collection_stats()
            
            return {
                "total_repos": total_repos,
                "processed_repos": processed_repos,
                "vector_documents": vector_stats["total_documents"],
                "processing_rate": f"{processed_repos}/{total_repos}" if total_repos > 0 else "0/0"
            }
        except Exception as e:
            logger.error(f"获取README统计信息失败: {e}")
            return {
                "total_repos": 0,
                "processed_repos": 0,
                "vector_documents": 0,
                "processing_rate": "0/0"
            }


# 全局README服务实例
readme_service = ReadmeService() 