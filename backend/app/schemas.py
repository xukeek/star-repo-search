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
    type: str  # "sync_status" | "sync_progress" | "readme_status" | "error"
    data: dict
    timestamp: datetime


class RepoReadmeBase(BaseModel):
    repo_id: int
    content: str
    content_hash: str
    embedding_id: Optional[str] = None


class RepoReadmeCreate(RepoReadmeBase):
    pass


class RepoReadme(RepoReadmeBase):
    id: int
    processed_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    min_similarity: float = 0.5


class SemanticSearchResult(BaseModel):
    repo_id: int
    repo_name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int
    similarity_score: float
    content_preview: str


class SemanticSearchResponse(BaseModel):
    results: List[SemanticSearchResult]
    total: int
    query: str
    processing_time: float


class ReadmeProcessingStatus(BaseModel):
    is_processing: bool
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    total_processed: int
    message: str


class SchedulerStatus(BaseModel):
    is_running: bool
    readme_processing: ReadmeProcessingStatus
    jobs: List[dict] 