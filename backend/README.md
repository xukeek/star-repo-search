# Star Repo Search Backend

基于 FastAPI 的 GitHub starred 仓库搜索后端服务。

## 功能特性

- 🔄 同步 GitHub starred 仓库到本地 SQLite 数据库
- 🔍 强大的搜索功能（支持名称、描述、语言、所有者等多维度搜索）
- 📊 仓库统计信息
- 🚀 异步处理，高性能
- 📝 完整的 API 文档（Swagger UI）

## 技术栈

- **FastAPI**: 现代、快速的 Web 框架
- **SQLAlchemy**: Python SQL 工具包和 ORM
- **SQLite**: 轻量级数据库
- **httpx**: 异步 HTTP 客户端
- **Poetry**: 依赖管理工具

## 快速开始

### 1. 安装依赖

```bash
cd backend
poetry install
```

### 2. 配置环境变量

复制环境变量示例文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，设置你的 GitHub Personal Access Token：
```
GITHUB_TOKEN=your_github_personal_access_token_here
DATABASE_URL=sqlite:///./starred_repos.db
CORS_ORIGINS=http://localhost:3000
```

### 3. 获取 GitHub Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择以下权限：
   - `public_repo` (访问公共仓库)
   - `read:user` (读取用户信息)
4. 复制生成的 token 到 `.env` 文件中

### 4. 启动服务

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务将在 http://localhost:8000 启动。

### 5. 查看 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### 核心功能

- `POST /sync` - 同步 GitHub starred 仓库
- `GET /sync/status` - 获取同步状态
- `GET /repos/search` - 搜索仓库
- `GET /repos/{repo_id}` - 获取仓库详情

### 辅助功能

- `GET /languages` - 获取所有编程语言列表
- `GET /owners` - 获取所有仓库所有者列表
- `GET /stats` - 获取仓库统计信息
- `DELETE /repos` - 删除所有仓库记录

### GitHub API

- `GET /github/user` - 获取 GitHub 用户信息
- `GET /github/rate-limit` - 获取 API 速率限制信息

## 搜索参数

搜索 API 支持以下参数：

- `query`: 关键词搜索（在名称、描述、全名、topics 中搜索）
- `language`: 编程语言过滤
- `owner`: 仓库所有者过滤
- `min_stars`: 最小 star 数
- `max_stars`: 最大 star 数
- `has_topics`: 是否有 topics
- `is_fork`: 是否为 fork 仓库
- `page`: 页码（默认 1）
- `per_page`: 每页数量（默认 20，最大 100）

## 使用示例

### 同步仓库

```bash
curl -X POST "http://localhost:8000/sync"
```

### 搜索仓库

```bash
# 基本搜索
curl "http://localhost:8000/repos/search?query=react"

# 高级搜索
curl "http://localhost:8000/repos/search?language=Python&min_stars=100&page=1&per_page=10"
```

### 获取统计信息

```bash
curl "http://localhost:8000/stats"
```

## 开发

### 代码格式化

```bash
poetry run black app/
poetry run isort app/
```

### 代码检查

```bash
poetry run flake8 app/
```

### 运行测试

```bash
poetry run pytest
```

## 数据库结构

主要表 `starred_repos` 包含以下字段：

- 基本信息：`name`, `full_name`, `description`, `html_url`
- 统计信息：`stargazers_count`, `forks_count`, `open_issues_count`
- 元数据：`language`, `topics`, `license_name`, `size`
- 时间信息：`starred_at`, `created_at`, `updated_at`
- 所有者信息：`owner_login`, `owner_avatar_url`
- 标志位：`is_fork`, `is_private`

## 注意事项

1. **GitHub API 限制**: 未认证请求每小时 60 次，认证请求每小时 5000 次
2. **同步时间**: 首次同步可能需要较长时间，取决于你的 starred 仓库数量
3. **数据更新**: 建议定期重新同步以获取最新的仓库信息

## 故障排除

### 常见问题

1. **Token 无效**: 确保 GitHub token 有效且具有正确权限
2. **数据库锁定**: 如果遇到数据库锁定，重启服务即可
3. **同步失败**: 检查网络连接和 GitHub API 限制

### 日志查看

服务运行时会输出详细日志，包括：
- API 请求日志
- 数据库操作日志
- 错误信息

## 许可证

MIT License 