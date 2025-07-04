from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./starred_repos.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class StarredRepo(Base):
    __tablename__ = "starred_repos"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, unique=True, index=True)
    name = Column(String, index=True)
    full_name = Column(String, index=True)
    description = Column(Text)
    html_url = Column(String)
    clone_url = Column(String)
    ssh_url = Column(String)
    language = Column(String, index=True)
    stargazers_count = Column(Integer)
    forks_count = Column(Integer)
    open_issues_count = Column(Integer)
    topics = Column(Text)  # JSON string
    owner_login = Column(String, index=True)
    owner_avatar_url = Column(String)
    starred_at = Column(DateTime, index=True)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    is_fork = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    size = Column(Integer)
    default_branch = Column(String)
    license_name = Column(String)
    license_key = Column(String)
    
    # 关联README内容
    readme_content = relationship("RepoReadme", back_populates="repo", uselist=False)


class RepoReadme(Base):
    __tablename__ = "repo_readmes"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("starred_repos.repo_id"), unique=True, index=True)
    content = Column(Text)  # README原始内容
    content_hash = Column(String)  # 内容哈希，用于检测变更
    embedding_id = Column(String)  # 向量数据库中的ID
    processed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联仓库
    repo = relationship("StarredRepo", back_populates="readme_content")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine) 