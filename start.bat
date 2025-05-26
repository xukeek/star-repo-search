@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Star Repo Search - Windows 启动脚本
:: 同时启动前端和后端服务

title Star Repo Search

echo ==================================
echo   Star Repo Search 启动脚本
echo ==================================
echo.

:: 检查是否在项目根目录
if not exist "package.json" (
    echo [ERROR] 请在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "backend" (
    echo [ERROR] 找不到 backend 目录
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ERROR] 找不到 frontend 目录
    pause
    exit /b 1
)

:: 解析命令行参数
set INSTALL_DEPS=false
set SKIP_ENV_CHECK=false

:parse_args
if "%~1"=="--install" (
    set INSTALL_DEPS=true
    shift
    goto parse_args
)
if "%~1"=="--skip-env-check" (
    set SKIP_ENV_CHECK=true
    shift
    goto parse_args
)
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
if not "%~1"=="" (
    echo [ERROR] 未知选项: %~1
    goto show_help
)

:: 检查依赖
echo [INFO] 检查依赖...

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 未安装或未添加到 PATH
    pause
    exit /b 1
)

:: 检查 Poetry
poetry --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Poetry 未安装或未添加到 PATH
    pause
    exit /b 1
)

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装或未添加到 PATH
    pause
    exit /b 1
)

:: 检查 pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm 未安装或未添加到 PATH
    pause
    exit /b 1
)

echo [SUCCESS] 所有依赖检查通过

:: 检查环境变量
if "%SKIP_ENV_CHECK%"=="false" (
    echo [INFO] 检查环境变量...
    
    if not exist "backend\.env" (
        echo [WARNING] backend\.env 文件不存在
        echo [INFO] 请复制 backend\env.example 到 backend\.env 并配置 GitHub Token
        pause
        exit /b 1
    )
    
    if not exist "frontend\.env.local" (
        echo [WARNING] frontend\.env.local 文件不存在，将自动创建
        echo NEXT_PUBLIC_API_URL=http://localhost:8000 > frontend\.env.local
        echo [SUCCESS] 已创建 frontend\.env.local
    )
)

:: 安装依赖
if "%INSTALL_DEPS%"=="true" (
    echo [INFO] 安装依赖...
    
    echo [INFO] 安装后端依赖...
    cd backend
    poetry install
    if errorlevel 1 (
        echo [ERROR] 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
    
    echo [INFO] 安装前端依赖...
    pnpm install
    if errorlevel 1 (
        echo [ERROR] 前端依赖安装失败
        pause
        exit /b 1
    )
    
    echo [SUCCESS] 依赖安装完成
)

:: 启动后端
echo [INFO] 启动后端服务...
cd backend
start "Backend Server" cmd /k "poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
cd ..

:: 等待后端启动
echo [INFO] 等待后端服务启动...
timeout /t 8 /nobreak >nul

:: 检查后端是否启动成功
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 后端服务可能未完全启动，请检查后端窗口
) else (
    echo [SUCCESS] 后端服务启动成功
    echo [INFO] 后端地址: http://localhost:8000
    echo [INFO] API 文档: http://localhost:8000/docs
)

:: 启动前端
echo [INFO] 启动前端服务...
start "Frontend Server" cmd /k "pnpm --filter star-repo-search-frontend dev"

:: 等待前端启动
echo [INFO] 等待前端服务启动...
timeout /t 5 /nobreak >nul

echo.
echo [SUCCESS] 所有服务启动完成！
echo.
echo 🌐 访问地址:
echo   前端应用: http://localhost:3000
echo   后端 API: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo.
echo 📝 使用说明:
echo   1. 首次使用请先同步 GitHub starred 仓库
echo   2. 关闭命令行窗口停止服务
echo.

pause
exit /b 0

:show_help
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   --install         安装依赖
echo   --skip-env-check  跳过环境变量检查
echo   -h, --help        显示帮助信息
echo.
pause
exit /b 0 