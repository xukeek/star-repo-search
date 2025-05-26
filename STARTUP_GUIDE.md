# 启动脚本使用指南

本项目提供了多种启动方式，适合不同的使用场景和操作系统。

## 🚀 启动脚本概览

| 脚本名称 | 适用系统 | 特点 | 推荐场景 |
|---------|---------|------|---------|
| `quick-start.sh` | Linux/macOS | 简单快速，自动配置 | 日常开发，快速体验 |
| `start.sh` | Linux/macOS | 功能完整，可配置选项 | 生产环境，团队开发 |
| `start.bat` | Windows | Windows 批处理脚本 | Windows 用户 |
| `pnpm scripts` | 跨平台 | 基于 package.json | 熟悉 Node.js 生态 |

## 📋 详细使用说明

### 1. quick-start.sh - 快速启动脚本

**特点：**
- 🎯 一键启动，无需复杂配置
- 🔧 自动创建环境文件
- 🚀 适合快速体验和日常开发

**使用方法：**
```bash
# 给脚本执行权限（首次使用）
chmod +x quick-start.sh

# 启动服务
./quick-start.sh
```

**工作流程：**
1. 检查项目目录结构
2. 自动创建 `backend/.env`（如果不存在）
3. 自动创建 `frontend/.env.local`
4. 启动后端服务（后台运行）
5. 启动前端服务
6. 显示访问地址

**停止服务：**
- 按 `Ctrl+C` 停止所有服务

### 2. start.sh - 完整启动脚本

**特点：**
- 🔍 完整的依赖检查
- ⚙️ 可配置的启动选项
- 📊 详细的状态反馈
- 🛡️ 错误处理和恢复

**使用方法：**
```bash
# 给脚本执行权限（首次使用）
chmod +x start.sh

# 基本启动
./start.sh

# 带依赖安装的启动
./start.sh --install

# 跳过环境变量检查
./start.sh --skip-env-check

# 查看帮助信息
./start.sh --help
```

**命令行选项：**
- `--install`: 自动安装前后端依赖
- `--skip-env-check`: 跳过环境变量文件检查
- `--help`: 显示帮助信息

**工作流程：**
1. 检查系统依赖（Python、Poetry、Node.js、pnpm）
2. 验证环境变量配置
3. 可选：安装项目依赖
4. 启动后端服务并验证
5. 启动前端服务
6. 显示服务状态和访问地址

### 3. start.bat - Windows 启动脚本

**特点：**
- 🪟 专为 Windows 设计
- 🎨 彩色输出和友好界面
- 🔧 自动环境配置

**使用方法：**
```cmd
# 双击运行或在命令行执行
start.bat

# 带参数启动
start.bat --install
start.bat --skip-env-check
start.bat --help
```

**注意事项：**
- Windows 脚本会在新窗口中启动前后端服务
- 关闭命令行窗口即可停止对应服务
- 确保已安装 Python、Poetry、Node.js 和 pnpm

### 4. pnpm 脚本 - 跨平台方案

**特点：**
- 🌐 跨平台兼容
- 📦 基于 Node.js 生态
- 🔧 灵活的脚本组合

**可用脚本：**
```bash
# 安装所有依赖
pnpm run setup

# 同时启动前后端
pnpm run start:all

# 分别启动服务
pnpm run dev:backend     # 仅启动后端
pnpm run dev:frontend    # 仅启动前端

# 安装依赖
pnpm run install:all     # 安装前后端依赖
pnpm run install:backend # 仅安装后端依赖
pnpm run install:frontend # 仅安装前端依赖

# 其他操作
pnpm run build          # 构建前端
pnpm run lint           # 代码检查
pnpm run clean          # 清理依赖
```

**使用 concurrently 同时启动：**
```bash
# 首次使用需要安装 concurrently
pnpm install concurrently

# 同时启动前后端
pnpm run start:all
```

## 🔧 环境配置

### 必需的环境文件

#### backend/.env
```bash
# GitHub Personal Access Token
GITHUB_TOKEN=your_github_token_here

# 数据库配置
DATABASE_URL=sqlite:///./starred_repos.db

# CORS 配置
CORS_ORIGINS=http://localhost:3000
```

#### frontend/.env.local
```bash
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### GitHub Token 获取步骤

1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 设置 Token 名称和过期时间
4. 选择权限：
   - ✅ `public_repo` - 访问公共仓库
   - ✅ `read:user` - 读取用户信息
5. 点击 "Generate token"
6. 复制生成的 Token 到 `backend/.env` 文件

## 🐛 常见问题

### Q: 脚本提示权限不足？
```bash
# 给脚本添加执行权限
chmod +x start.sh
chmod +x quick-start.sh
```

### Q: 找不到 Poetry 或 pnpm？
确保已正确安装并添加到系统 PATH：
```bash
# 检查安装状态
poetry --version
pnpm --version
```

### Q: 端口被占用？
```bash
# 查找占用端口的进程
lsof -i :8000  # 后端端口
lsof -i :3000  # 前端端口

# 杀死进程
kill -9 <PID>
```

### Q: 后端启动失败？
1. 检查 GitHub Token 是否正确
2. 确认 Python 和 Poetry 版本
3. 查看后端日志输出

### Q: 前端无法连接后端？
1. 确认后端服务已启动
2. 检查 `frontend/.env.local` 中的 API 地址
3. 确认防火墙设置

## 🎯 推荐使用方式

### 首次使用
```bash
# 1. 克隆项目
git clone <repository-url>
cd star-repo-search

# 2. 快速启动
./quick-start.sh
```

### 日常开发
```bash
# 快速启动（推荐）
./quick-start.sh

# 或使用 pnpm 脚本
pnpm run start:all
```

### 生产部署
```bash
# 完整检查和启动
./start.sh --install
```

### Windows 用户
```cmd
# 双击运行
start.bat

# 或命令行启动
start.bat --install
```

## 📚 更多资源

- [项目主文档](./README.md)
- [后端文档](./backend/README.md)
- [前端文档](./frontend/README.md)
- [API 文档](http://localhost:8000/docs)（启动后访问）

---

💡 **提示**: 如果遇到问题，请先查看控制台输出的错误信息，大多数问题都有明确的错误提示和解决建议。 