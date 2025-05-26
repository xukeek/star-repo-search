# Star Repo Search Frontend

基于 Next.js 15 的 GitHub starred 仓库搜索前端应用。

## 功能特性

- 🎨 现代化的 UI 设计，基于 shadcn/ui 组件库
- 🔍 强大的搜索和过滤功能
- 📱 响应式设计，支持移动端
- ⚡ 快速加载和流畅的用户体验
- 📊 仓库统计信息展示
- 🔄 实时同步状态显示
- 🎯 智能分页和排序

## 技术栈

- **Next.js 15**: React 全栈框架
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 实用优先的 CSS 框架
- **shadcn/ui**: 高质量的 React 组件库
- **Lucide React**: 美观的图标库
- **Axios**: HTTP 客户端
- **pnpm**: 快速、节省磁盘空间的包管理器

## 快速开始

### 1. 安装依赖

```bash
cd frontend
pnpm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 启动开发服务器

```bash
pnpm dev
```

应用将在 http://localhost:3000 启动。

### 4. 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
frontend/
├── app/                    # Next.js 13+ App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── repo-card.tsx     # 仓库卡片组件
│   └── search-filters.tsx # 搜索过滤器组件
├── lib/                  # 工具库
│   ├── api.ts           # API 客户端
│   └── utils.ts         # 工具函数
├── public/              # 静态资源
├── .npmrc               # pnpm 配置
└── package.json         # 项目配置
```

## 主要组件

### RepoCard
仓库信息卡片，显示：
- 仓库名称和描述
- 所有者信息和头像
- Star、Fork、Issue 数量
- 编程语言和许可证
- 主题标签
- Star 时间

### SearchFilters
搜索和过滤组件，支持：
- 关键词搜索
- 编程语言过滤
- 仓库所有者过滤
- Star 数量范围
- 是否有主题
- 是否为 Fork 仓库

### 主页面 (HomePage)
- 统计信息展示
- 同步状态监控
- 搜索结果展示
- 分页导航

## API 集成

前端通过 Axios 与后端 API 通信，主要接口包括：

- `GET /repos/search` - 搜索仓库
- `POST /sync` - 同步仓库
- `GET /sync/status` - 获取同步状态
- `GET /stats` - 获取统计信息
- `GET /languages` - 获取语言列表
- `GET /owners` - 获取所有者列表

## 样式系统

使用 Tailwind CSS 和 shadcn/ui 构建一致的设计系统：

### 颜色主题
- 支持亮色和暗色主题
- 语义化的颜色变量
- 一致的颜色使用规范

### 组件设计
- 统一的间距和圆角
- 一致的阴影和边框
- 响应式设计原则

### 动画效果
- 平滑的过渡动画
- 加载状态指示
- 交互反馈动画

## 响应式设计

- **移动端** (< 768px): 单列布局，简化导航
- **平板端** (768px - 1024px): 双列布局，保持功能完整
- **桌面端** (> 1024px): 三列布局，最佳用户体验

## 性能优化

- **代码分割**: 使用 Next.js 自动代码分割
- **图片优化**: 使用 Next.js Image 组件
- **懒加载**: 组件和数据的按需加载
- **缓存策略**: 合理的 API 缓存和状态管理

## 开发指南

### 添加新组件

1. 在 `components/` 目录下创建组件文件
2. 使用 TypeScript 定义 props 接口
3. 遵循 shadcn/ui 的设计规范
4. 添加适当的响应式样式

### 样式规范

```tsx
// 使用 cn 函数合并样式
import { cn } from "@/lib/utils"

function MyComponent({ className, ...props }) {
  return (
    <div 
      className={cn(
        "base-styles",
        "responsive-styles",
        className
      )}
      {...props}
    />
  )
}
```

### API 调用

```tsx
// 使用统一的 API 客户端
import { searchRepos } from "@/lib/api"

const handleSearch = async () => {
  try {
    const results = await searchRepos(params)
    setResults(results)
  } catch (error) {
    console.error('Search failed:', error)
  }
}
```

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量 `NEXT_PUBLIC_API_URL`
3. 自动部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile --prod

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

### 静态导出

```bash
pnpm build
pnpm export
```

## 浏览器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 故障排除

### 常见问题

1. **API 连接失败**: 检查 `NEXT_PUBLIC_API_URL` 环境变量
2. **样式不生效**: 确保 Tailwind CSS 配置正确
3. **图片加载失败**: 检查 Next.js 图片域名配置

### 开发工具

- **React Developer Tools**: 调试 React 组件
- **Tailwind CSS IntelliSense**: VS Code 扩展
- **TypeScript**: 类型检查和智能提示

## 许可证

MIT License 