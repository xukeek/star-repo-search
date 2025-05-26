# 语义搜索功能说明

## 功能概述

本项目新增了基于DeepSeek AI的语义搜索功能，可以通过README内容进行智能搜索，找到与查询意图最相关的GitHub仓库。

## 主要特性

### 1. 自动README处理
- **定时任务**: 每天凌晨2点自动处理所有仓库的README文件
- **增量处理**: 每6小时处理最近更新的50个仓库
- **手动触发**: 支持手动触发README处理任务

### 2. 向量数据库存储
- 使用ChromaDB存储README内容的向量表示
- 支持高效的相似度搜索
- 自动检测内容变更，避免重复处理

### 3. 语义搜索API
- 基于DeepSeek embedding模型的语义搜索
- 支持相似度阈值过滤
- 返回详细的仓库信息和内容预览

## 新增API端点

### README处理相关

#### 手动触发README处理
```http
POST /readmes/process
Content-Type: application/json

{
  "max_repos": 100  // 可选，限制处理的仓库数量
}
```

#### 获取README处理统计
```http
GET /readmes/stats
```

响应示例：
```json
{
  "total_repos": 1500,
  "processed_repos": 1200,
  "vector_documents": 1200,
  "processing_rate": "1200/1500",
  "vector_stats": {
    "total_documents": 1200,
    "collection_name": "repo_readmes"
  }
}
```

### 语义搜索

#### 语义搜索仓库
```http
POST /repos/semantic-search
Content-Type: application/json

{
  "query": "机器学习框架",
  "limit": 10,
  "min_similarity": 0.5
}
```

响应示例：
```json
{
  "results": [
    {
      "repo_id": 123,
      "repo_name": "tensorflow",
      "full_name": "tensorflow/tensorflow",
      "description": "An Open Source Machine Learning Framework",
      "language": "Python",
      "stars": 185000,
      "similarity_score": 0.92,
      "content_preview": "TensorFlow is an end-to-end open source platform for machine learning..."
    }
  ],
  "total": 1,
  "query": "机器学习框架",
  "processing_time": 0.234
}
```

### 调度器管理

#### 获取调度器状态
```http
GET /scheduler/status
```

#### 启动调度器
```http
POST /scheduler/start
```

#### 停止调度器
```http
POST /scheduler/stop
```

## WebSocket实时通知

新增了README处理状态的实时通知：

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/sync');

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    
    if (message.type === 'readme_status') {
        console.log('README处理状态:', message.data);
        // message.data 包含:
        // - is_processing: 是否正在处理
        // - last_run: 上次运行时间
        // - next_run: 下次运行时间
        // - total_processed: 已处理数量
        // - message: 状态消息
    }
};
```

## 环境配置

需要在`.env`文件中添加DeepSeek API密钥：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## 依赖包

新增的依赖包：
- `chromadb`: 向量数据库
- `openai`: DeepSeek API客户端
- `apscheduler`: 定时任务调度
- `sentence-transformers`: 文本向量化（备用）

## 使用流程

1. **配置环境变量**: 设置DeepSeek API密钥
2. **启动应用**: 调度器会自动启动
3. **同步仓库**: 首先同步GitHub starred仓库
4. **处理README**: 手动触发或等待定时任务处理README
5. **语义搜索**: 使用语义搜索API查找相关仓库

## 注意事项

1. **API限制**: GitHub API有速率限制，README处理会自动添加延迟
2. **内容长度**: README内容会被截断到8000字符以内
3. **相似度阈值**: 建议设置0.5以上的相似度阈值获得更准确的结果
4. **存储空间**: 向量数据库会占用额外的磁盘空间

## 故障排除

### 常见问题

1. **DeepSeek API错误**: 检查API密钥是否正确配置
2. **ChromaDB错误**: 确保有足够的磁盘空间
3. **调度器启动失败**: 检查日志中的错误信息

### 日志查看

应用启动时会显示调度器状态：
```
定时任务调度器已启动
```

README处理过程中的日志：
```
开始批量处理 1500 个仓库的README
已处理 100/1500 个仓库，成功 95 个
``` 