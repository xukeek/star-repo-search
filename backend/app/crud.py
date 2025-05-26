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
    has_topics: Optional[bool] = None,
    is_fork: Optional[bool] = None,
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
    
    # 分页和排序
    repos = (
        db_query
        .order_by(StarredRepo.starred_at.desc())
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