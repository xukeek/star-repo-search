# Star Repo Search

一个用于搜索和管理 GitHub starred 仓库的全栈应用。

## 项目概述

Star Repo Search 是一个帮助开发者更好地管理和搜索自己 GitHub starred 仓库的工具。它可以同步你的所有 starred 仓库到本地数据库，并提供强大的搜索和过滤功能。

## 功能特性

### 🔄 数据同步
- 自动同步 GitHub starred 仓库
- 保存详细的仓库信息和 star 时间
- 支持增量更新

### 🔍 强大搜索
- 全文搜索（名称、描述、主题）
- 多维度过滤（语言、所有者、star 数量等）
- 智能分页和排序

### 📊 统计分析
- 仓库总数统计
- Star 和 Fork 数量统计
- 编程语言分布
- 可视化数据展示

### 🎨 现代化界面
- 响应式设计，支持移动端
- 美观的卡片式布局
- 实时状态更新
- 流畅的用户体验

## 技术栈

### 后端
- **FastAPI**: 现代、快速的 Web 框架
- **SQLAlchemy**: Python SQL 工具包和 ORM
- **SQLite**: 轻量级数据库
- **httpx**: 异步 HTTP 客户端
- **Poetry**: 依赖管理工具

### 前端
- **Next.js 15**: React 全栈框架
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 实用优先的 CSS 框架
- **shadcn/ui**: 高质量的 React 组件库
- **Lucide React**: 美观的图标库

## 项目结构

```
star-repo-search/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI 应用入口
│   │   ├── database.py     # 数据库配置和模型
│   │   ├── schemas.py      # Pydantic 模型
│   │   ├── crud.py         # 数据库操作
│   │   └── github_service.py # GitHub API 服务
│   ├── pyproject.toml      # Poetry 配置
│   ├── env.example         # 环境变量示例
│   └── README.md
├── frontend/               # Next.js 前端
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/            # 基础 UI 组件
│   │   ├── repo-card.tsx
│   │   └── search-filters.tsx
│   ├── lib/
│   │   ├── api.ts         # API 客户端
│   │   └── utils.ts
│   ├── package.json
│   └── README.md
└── README.md              # 项目总览
```

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 18+
- Poetry (Python 依赖管理)
- pnpm (推荐的 Node.js 包管理器)

### 1. 克隆项目

```bash
git clone <repository-url>
cd star-repo-search
```

### 2. 使用 pnpm 工作区（推荐）

项目支持 pnpm 工作区，可以从根目录管理前端依赖：

```bash
# 安装前端依赖
pnpm install

# 启动前端开发服务器
pnpm dev

# 构建前端
pnpm build
```

### 3. 设置后端

```bash
cd backend

# 安装依赖
poetry install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，设置你的 GitHub Token

# 启动后端服务
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 设置前端（如果不使用工作区）

```bash
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动前端服务
pnpm dev
```

### 5. 访问应用

- 前端应用: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 配置说明

### GitHub Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择以下权限：
   - `public_repo` (访问公共仓库)
   - `read:user` (读取用户信息)
4. 复制生成的 token 到后端的 `.env` 文件中

### 环境变量

#### 后端 (.env)
```
GITHUB_TOKEN=your_github_personal_access_token_here
DATABASE_URL=sqlite:///./starred_repos.db
CORS_ORIGINS=http://localhost:3000
```

#### 前端 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 使用指南

### 1. 同步仓库

首次使用时，点击"同步仓库"按钮来获取你的所有 starred 仓库。同步时间取决于你的 starred 仓库数量。

### 2. 搜索仓库

- **基础搜索**: 在搜索框中输入关键词
- **高级过滤**: 点击"过滤器"按钮设置更多条件
- **快速过滤**: 点击语言标签快速过滤

### 3. 查看详情

点击仓库卡片上的链接图标可以直接访问 GitHub 仓库页面。

## API 文档

后端提供完整的 RESTful API，主要端点包括：

- `POST /sync` - 同步 GitHub starred 仓库
- `GET /sync/status` - 获取同步状态
- `GET /repos/search` - 搜索仓库
- `GET /repos/{repo_id}` - 获取仓库详情
- `GET /stats` - 获取统计信息
- `GET /languages` - 获取所有编程语言
- `GET /owners` - 获取所有仓库所有者

详细的 API 文档可以在 http://localhost:8000/docs 查看。

## 部署

### Docker 部署

```bash
# 构建后端镜像
cd backend
docker build -t star-repo-search-backend .

# 构建前端镜像
cd frontend
docker build -t star-repo-search-frontend .

# 使用 docker-compose 启动
docker-compose up -d
```

### 生产环境部署

1. **后端**: 可以部署到任何支持 Python 的平台（如 Heroku、Railway、VPS）
2. **前端**: 推荐部署到 Vercel、Netlify 或其他静态托管平台
3. **数据库**: 生产环境建议使用 PostgreSQL 或 MySQL

## 开发指南

### 后端开发

```bash
cd backend

# 安装开发依赖
poetry install

# 代码格式化
poetry run black app/
poetry run isort app/

# 代码检查
poetry run flake8 app/

# 运行测试
poetry run pytest
```

### 前端开发

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码检查
pnpm run lint

# 构建生产版本
pnpm run build
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 常见问题

### Q: 同步失败怎么办？
A: 检查 GitHub Token 是否有效，网络连接是否正常，以及是否达到 API 限制。

### Q: 搜索结果为空？
A: 确保已经同步了仓库数据，检查搜索条件是否过于严格。

### Q: 前端无法连接后端？
A: 检查后端服务是否启动，环境变量 `NEXT_PUBLIC_API_URL` 是否正确。

## 许可证

MIT License

## 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Python Web 框架
- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 美观的 React 组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架 