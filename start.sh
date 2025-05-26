#!/bin/bash

# Star Repo Search - 启动脚本
# 同时启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查 Python 和 Poetry
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi
    
    if ! command -v poetry &> /dev/null; then
        log_error "Poetry 未安装"
        exit 1
    fi
    
    # 检查 Node.js 和 pnpm
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装"
        exit 1
    fi
    
    log_success "所有依赖检查通过"
}

# 检查环境变量
check_env() {
    log_info "检查环境变量..."
    
    if [ ! -f "backend/.env" ]; then
        log_warning "backend/.env 文件不存在"
        log_info "请复制 backend/env.example 到 backend/.env 并配置 GitHub Token"
        return 1
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        log_warning "frontend/.env.local 文件不存在，将自动创建"
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
        log_success "已创建 frontend/.env.local"
    fi
    
    return 0
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    poetry install
    cd ..
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    pnpm install
    
    log_success "依赖安装完成"
}

# 启动后端
start_backend() {
    log_info "启动后端服务..."
    cd backend
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    sleep 5
    
    # 检查后端是否启动成功
    if curl -s http://localhost:8000/health > /dev/null; then
        log_success "后端服务启动成功 (PID: $BACKEND_PID)"
        log_info "后端地址: http://localhost:8000"
        log_info "API 文档: http://localhost:8000/docs"
    else
        log_error "后端服务启动失败"
        return 1
    fi
}

# 启动前端
start_frontend() {
    log_info "启动前端服务..."
    pnpm --filter star-repo-search-frontend dev &
    FRONTEND_PID=$!
    
    # 等待前端启动
    log_info "等待前端服务启动..."
    sleep 8
    
    log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
    log_info "前端地址: http://localhost:3000 或 http://localhost:3001"
}

# 清理函数
cleanup() {
    log_info "正在停止服务..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_info "后端服务已停止"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_info "前端服务已停止"
    fi
    
    # 杀死所有相关进程
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    log_success "所有服务已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo "=================================="
    echo "  Star Repo Search 启动脚本"
    echo "=================================="
    echo ""
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 解析命令行参数
    INSTALL_DEPS=false
    SKIP_ENV_CHECK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                INSTALL_DEPS=true
                shift
                ;;
            --skip-env-check)
                SKIP_ENV_CHECK=true
                shift
                ;;
            -h|--help)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --install         安装依赖"
                echo "  --skip-env-check  跳过环境变量检查"
                echo "  -h, --help        显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行检查和启动
    check_dependencies
    
    if [ "$SKIP_ENV_CHECK" = false ]; then
        if ! check_env; then
            log_error "环境变量检查失败，请配置后重试"
            exit 1
        fi
    fi
    
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies
    fi
    
    start_backend
    start_frontend
    
    echo ""
    log_success "所有服务启动完成！"
    echo ""
    echo "🌐 访问地址:"
    echo "  前端应用: http://localhost:3000"
    echo "  后端 API: http://localhost:8000"
    echo "  API 文档: http://localhost:8000/docs"
    echo ""
    echo "📝 使用说明:"
    echo "  1. 首次使用请先同步 GitHub starred 仓库"
    echo "  2. 按 Ctrl+C 停止所有服务"
    echo ""
    
    # 保持脚本运行
    wait
}

# 运行主函数
main "$@" 