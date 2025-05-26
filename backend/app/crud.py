from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
import json
from . import schemas
from .database import StarredRepo


def get_repo_by_repo_id(db: Session, repo_id: int) -> Optional[StarredRepo]:
    """根据repo_id获取仓库"""
    return db.query(StarredRepo).filter(StarredRepo.repo_id == repo_id).first()


def create_starred_repo(db: Session, repo: schemas.StarredRepoCreate) -> StarredRepo:
    """创建新的starred仓库记录"""
    db_repo = StarredRepo(**repo.dict())
    db.add(db_repo)
    db.commit()
    db.refresh(db_repo)
    return db_repo


def update_starred_repo(db: Session, repo_id: int, repo: schemas.StarredRepoCreate) -> Optional[StarredRepo]:
    """更新starred仓库记录"""
    db_repo = get_repo_by_repo_id(db, repo_id)
    if db_repo:
        for key, value in repo.dict().items():
            setattr(db_repo, key, value)
        db.commit()
        db.refresh(db_repo)
    return db_repo


def upsert_starred_repo(db: Session, repo: schemas.StarredRepoCreate) -> StarredRepo:
    """插入或更新starred仓库记录"""
    existing_repo = get_repo_by_repo_id(db, repo.repo_id)
    if existing_repo:
        return update_starred_repo(db, repo.repo_id, repo)
    else:
        return create_starred_repo(db, repo)


def search_repos(
    db: Session,
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
    per_page: int = 20
) -> tuple[List[StarredRepo], int]:
    """搜索starred仓库"""
    db_query = db.query(StarredRepo)
    
    # 构建搜索条件
    conditions = []
    
    if query:
        # 在名称、描述、全名中搜索
        search_conditions = [
            StarredRepo.name.ilike(f"%{query}%"),
            StarredRepo.description.ilike(f"%{query}%"),
            StarredRepo.full_name.ilike(f"%{query}%"),
            StarredRepo.topics.ilike(f"%{query}%")
        ]
        conditions.append(or_(*search_conditions))
    
    if language:
        conditions.append(StarredRepo.language.ilike(f"%{language}%"))
    
    if owner:
        conditions.append(StarredRepo.owner_login.ilike(f"%{owner}%"))
    
    if min_stars is not None:
        conditions.append(StarredRepo.stargazers_count >= min_stars)
    
    if max_stars is not None:
        conditions.append(StarredRepo.stargazers_count <= max_stars)
    
    # 添加star时间范围搜索
    if starred_after:
        from datetime import datetime
        try:
            # 处理多种日期格式
            if 'T' in starred_after:
                # ISO格式: 2023-01-01T00:00:00Z
                after_date = datetime.fromisoformat(starred_after.replace('Z', '+00:00'))
            else:
                # 日期格式: 2023-01-01
                after_date = datetime.strptime(starred_after, '%Y-%m-%d')
            conditions.append(StarredRepo.starred_at >= after_date)
        except ValueError:
            pass  # 忽略无效的日期格式
    
    if starred_before:
        from datetime import datetime
        try:
            # 处理多种日期格式
            if 'T' in starred_before:
                # ISO格式: 2023-01-01T23:59:59Z
                before_date = datetime.fromisoformat(starred_before.replace('Z', '+00:00'))
            else:
                # 日期格式: 2023-01-01，设置为当天结束时间
                before_date = datetime.strptime(starred_before + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
            conditions.append(StarredRepo.starred_at <= before_date)
        except ValueError:
            pass  # 忽略无效的日期格式
    
    if has_topics is not None:
        if has_topics:
            conditions.append(and_(
                StarredRepo.topics.isnot(None),
                StarredRepo.topics != "[]"
            ))
        else:
            conditions.append(or_(
                StarredRepo.topics.is_(None),
                StarredRepo.topics == "[]"
            ))
    
    if is_fork is not None:
        conditions.append(StarredRepo.is_fork == is_fork)
    
    # 应用所有条件
    if conditions:
        db_query = db_query.filter(and_(*conditions))
    
    # 获取总数
    total = db_query.count()
    
    # 构建排序
    sort_column = getattr(StarredRepo, sort_by, StarredRepo.starred_at)
    if sort_order.lower() == 'asc':
        order_clause = sort_column.asc()
    else:
        order_clause = sort_column.desc()
    
    # 分页和排序
    repos = (
        db_query
        .order_by(order_clause)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    return repos, total


def get_all_languages(db: Session) -> List[str]:
    """获取所有编程语言列表"""
    languages = (
        db.query(StarredRepo.language)
        .filter(StarredRepo.language.isnot(None))
        .distinct()
        .all()
    )
    return [lang[0] for lang in languages if lang[0]]


def get_all_owners(db: Session) -> List[str]:
    """获取所有仓库所有者列表"""
    owners = (
        db.query(StarredRepo.owner_login)
        .distinct()
        .all()
    )
    return [owner[0] for owner in owners]


def get_repo_stats(db: Session) -> dict:
    """获取仓库统计信息"""
    total_repos = db.query(StarredRepo).count()
    total_stars = db.query(func.sum(StarredRepo.stargazers_count)).scalar() or 0
    total_forks = db.query(func.sum(StarredRepo.forks_count)).scalar() or 0
    
    language_stats = (
        db.query(StarredRepo.language, func.count(StarredRepo.id))
        .filter(StarredRepo.language.isnot(None))
        .group_by(StarredRepo.language)
        .order_by(func.count(StarredRepo.id).desc())
        .limit(10)
        .all()
    )
    
    return {
        "total_repos": total_repos,
        "total_stars": total_stars,
        "total_forks": total_forks,
        "top_languages": [{"language": lang, "count": count} for lang, count in language_stats]
    }


def delete_all_repos(db: Session) -> int:
    """删除所有仓库记录"""
    count = db.query(StarredRepo).count()
    db.query(StarredRepo).delete()
    db.commit()
    return count


def bulk_upsert_starred_repos(db: Session, repos: List[schemas.StarredRepoCreate], batch_size: int = 100) -> dict:
    """批量插入或更新starred仓库记录"""
    total_repos = len(repos)
    created_count = 0
    updated_count = 0
    
    try:
        # 分批处理，避免内存占用过大
        for i in range(0, total_repos, batch_size):
            batch = repos[i:i + batch_size]
            
            # 获取当前批次中所有repo_id
            repo_ids = [repo.repo_id for repo in batch]
            
            # 查询已存在的仓库
            existing_repos = db.query(StarredRepo).filter(
                StarredRepo.repo_id.in_(repo_ids)
            ).all()
            
            # 创建repo_id到现有记录的映射
            existing_map = {repo.repo_id: repo for repo in existing_repos}
            
            # 分离新增和更新的记录
            repos_to_create = []
            repos_to_update = []
            
            for repo in batch:
                if repo.repo_id in existing_map:
                    # 更新现有记录
                    existing_repo = existing_map[repo.repo_id]
                    for key, value in repo.dict().items():
                        setattr(existing_repo, key, value)
                    repos_to_update.append(existing_repo)
                else:
                    # 创建新记录
                    repos_to_create.append(StarredRepo(**repo.dict()))
            
            # 批量添加新记录
            if repos_to_create:
                db.add_all(repos_to_create)
                created_count += len(repos_to_create)
            
            # 更新记录数
            updated_count += len(repos_to_update)
            
            # 提交当前批次
            db.commit()
            
        return {
            "total_processed": total_repos,
            "created": created_count,
            "updated": updated_count
        }
        
    except Exception as e:
        db.rollback()
        raise e


def bulk_upsert_starred_repos_fast(db: Session, repos: List[schemas.StarredRepoCreate], batch_size: int = 500) -> dict:
    """高性能批量插入或更新starred仓库记录，使用bulk操作"""
    from sqlalchemy.dialects.sqlite import insert
    
    total_repos = len(repos)
    created_count = 0
    updated_count = 0
    
    try:
        # 分批处理
        for i in range(0, total_repos, batch_size):
            batch = repos[i:i + batch_size]
            
            # 准备数据
            repo_data_list = []
            for repo in batch:
                repo_dict = repo.dict()
                # 确保datetime对象正确序列化
                for key, value in repo_dict.items():
                    if hasattr(value, 'isoformat'):  # datetime对象
                        repo_dict[key] = value
                repo_data_list.append(repo_dict)
            
            # 使用SQLite的INSERT OR REPLACE语法进行upsert
            # 注意：这需要表有唯一约束
            stmt = insert(StarredRepo).values(repo_data_list)
            
            # 对于SQLite，使用ON CONFLICT DO UPDATE
            stmt = stmt.on_conflict_do_update(
                index_elements=['repo_id'],
                set_={
                    'name': stmt.excluded.name,
                    'full_name': stmt.excluded.full_name,
                    'description': stmt.excluded.description,
                    'html_url': stmt.excluded.html_url,
                    'clone_url': stmt.excluded.clone_url,
                    'ssh_url': stmt.excluded.ssh_url,
                    'language': stmt.excluded.language,
                    'stargazers_count': stmt.excluded.stargazers_count,
                    'forks_count': stmt.excluded.forks_count,
                    'open_issues_count': stmt.excluded.open_issues_count,
                    'topics': stmt.excluded.topics,
                    'owner_login': stmt.excluded.owner_login,
                    'owner_avatar_url': stmt.excluded.owner_avatar_url,
                    'starred_at': stmt.excluded.starred_at,
                    'created_at': stmt.excluded.created_at,
                    'updated_at': stmt.excluded.updated_at,
                    'is_fork': stmt.excluded.is_fork,
                    'is_private': stmt.excluded.is_private,
                    'size': stmt.excluded.size,
                    'default_branch': stmt.excluded.default_branch,
                    'license_name': stmt.excluded.license_name,
                    'license_key': stmt.excluded.license_key,
                }
            )
            
            # 执行批量操作
            result = db.execute(stmt)
            db.commit()
            
            # 估算创建和更新的数量（SQLite不直接提供这些信息）
            batch_size_actual = len(batch)
            created_count += batch_size_actual  # 简化统计
            
        return {
            "total_processed": total_repos,
            "created": created_count,
            "updated": 0,  # 简化统计
            "method": "bulk_fast"
        }
        
    except Exception as e:
        db.rollback()
        # 如果快速方法失败，回退到常规方法
        print(f"Fast bulk upsert failed, falling back to regular method: {e}")
        return bulk_upsert_starred_repos(db, repos, batch_size=100) 