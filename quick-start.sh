#!/bin/bash

# Star Repo Search - 快速启动脚本
# 简化版本，适合日常开发使用

set -e

echo "🚀 Star Repo Search - 快速启动"
echo "================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查环境文件
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env 文件不存在"
    echo "📝 正在从 env.example 创建..."
    cp backend/env.example backend/.env
    echo "✅ 已创建 backend/.env，请编辑并添加您的 GitHub Token"
    echo "🔗 获取 Token: https://github.com/settings/tokens"
    echo ""
    read -p "按 Enter 继续（确保已配置 GitHub Token）..."
fi

# 创建前端环境文件
if [ ! -f "frontend/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
    echo "✅ 已创建 frontend/.env.local"
fi

echo "🔧 启动服务..."

# 启动后端（后台运行）
echo "📡 启动后端服务..."
cd backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🌐 启动前端服务..."
pnpm --filter star-repo-search-frontend dev &
FRONTEND_PID=$!

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    echo "✅ 服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "🎉 服务启动完成！"
echo ""
echo "📱 访问地址:"
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo "   文档: http://localhost:8000/docs"
echo ""
echo "💡 提示: 按 Ctrl+C 停止所有服务"
echo ""

# 保持脚本运行
wait 