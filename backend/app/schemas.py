from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class StarredRepoBase(BaseModel):
    repo_id: int
    name: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    clone_url: str
    ssh_url: str
    language: Optional[str] = None
    stargazers_count: int
    forks_count: int
    open_issues_count: int
    topics: Optional[str] = None
    owner_login: str
    owner_avatar_url: str
    starred_at: datetime
    created_at: datetime
    updated_at: datetime
    is_fork: bool = False
    is_private: bool = False
    size: int
    default_branch: str
    license_name: Optional[str] = None
    license_key: Optional[str] = None


class StarredRepoCreate(StarredRepoBase):
    pass


class StarredRepo(StarredRepoBase):
    id: int

    class Config:
        from_attributes = True


class SearchParams(BaseModel):
    query: Optional[str] = None
    language: Optional[str] = None
    owner: Optional[str] = None
    min_stars: Optional[int] = None
    max_stars: Optional[int] = None
    starred_after: Optional[str] = None
    starred_before: Optional[str] = None
    has_topics: Optional[bool] = None
    is_fork: Optional[bool] = None
    sort_by: Optional[str] = 'starred_at'
    sort_order: Optional[str] = 'desc'
    page: int = 1
    per_page: int = 20


class SearchResponse(BaseModel):
    repos: List[StarredRepo]
    total: int
    page: int
    per_page: int
    total_pages: int


class SyncStatus(BaseModel):
    is_syncing: bool
    last_sync: Optional[datetime] = None
    total_repos: int
    message: str


class SyncProgress(BaseModel):
    current: int
    total: int
    percentage: float
    message: str


class WebSocketMessage(BaseModel):
    type: str  # "sync_status" | "sync_progress" | "error"
    data: dict
    timestamp: datetime 