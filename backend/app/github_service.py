import httpx
import json
import os
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


class GitHubService:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3.star+json",
            "User-Agent": "star-repo-search"
        }
        self.base_url = "https://api.github.com"

    async def get_user_info(self) -> Dict[str, Any]:
        """获取当前用户信息"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/user",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_starred_repos(self, username: str = None) -> List[Dict[str, Any]]:
        """获取用户所有star的仓库"""
        if not username:
            user_info = await self.get_user_info()
            username = user_info["login"]

        all_repos = []
        page = 1
        per_page = 100

        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                response = await client.get(
                    f"{self.base_url}/users/{username}/starred",
                    headers=self.headers,
                    params={"page": page, "per_page": per_page}
                )
                response.raise_for_status()
                
                repos = response.json()
                if not repos:
                    break
                
                # 处理每个仓库的数据
                for repo_data in repos:
                    repo = self._process_repo_data(repo_data)
                    all_repos.append(repo)
                
                page += 1
                
                # 检查是否还有更多页面
                if len(repos) < per_page:
                    break

        return all_repos

    def _process_repo_data(self, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理仓库数据，提取需要的字段"""
        repo = repo_data.get("repo", repo_data)
        starred_at = repo_data.get("starred_at")
        
        # 如果没有starred_at，使用当前时间
        if not starred_at:
            starred_at = datetime.utcnow().isoformat() + "Z"

        return {
            "repo_id": repo["id"],
            "name": repo["name"],
            "full_name": repo["full_name"],
            "description": repo.get("description"),
            "html_url": repo["html_url"],
            "clone_url": repo["clone_url"],
            "ssh_url": repo["ssh_url"],
            "language": repo.get("language"),
            "stargazers_count": repo["stargazers_count"],
            "forks_count": repo["forks_count"],
            "open_issues_count": repo["open_issues_count"],
            "topics": json.dumps(repo.get("topics", [])),
            "owner_login": repo["owner"]["login"],
            "owner_avatar_url": repo["owner"]["avatar_url"],
            "starred_at": datetime.fromisoformat(starred_at.replace("Z", "+00:00")),
            "created_at": datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00")),
            "updated_at": datetime.fromisoformat(repo["updated_at"].replace("Z", "+00:00")),
            "is_fork": repo["fork"],
            "is_private": repo["private"],
            "size": repo["size"],
            "default_branch": repo["default_branch"],
            "license_name": repo["license"]["name"] if repo.get("license") else None,
            "license_key": repo["license"]["key"] if repo.get("license") else None,
        }

    async def check_rate_limit(self) -> Dict[str, Any]:
        """检查API速率限制"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/rate_limit",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json() 