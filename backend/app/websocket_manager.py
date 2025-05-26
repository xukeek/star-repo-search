from typing import List, Dict, Any
from fastapi import WebSocket
import json
import asyncio
from datetime import datetime


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """接受WebSocket连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """发送个人消息"""
        try:
            await websocket.send_text(message)
        except Exception:
            # 连接已断开，移除它
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """广播消息给所有连接的客户端"""
        if not self.active_connections:
            return
        
        message_str = json.dumps(message, default=str)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception:
                # 连接已断开，标记为需要移除
                disconnected.append(connection)
        
        # 移除断开的连接
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_sync_status(self, status: Dict[str, Any]):
        """广播同步状态更新"""
        message = {
            "type": "sync_status",
            "data": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def broadcast_sync_progress(self, current: int, total: int, message: str):
        """广播同步进度"""
        progress_data = {
            "type": "sync_progress",
            "data": {
                "current": current,
                "total": total,
                "percentage": round((current / total) * 100, 2) if total > 0 else 0,
                "message": message
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(progress_data)
    
    async def broadcast_readme_status(self, status: Dict[str, Any]):
        """广播README处理状态更新"""
        message = {
            "type": "readme_status",
            "data": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)


# 全局WebSocket管理器实例
websocket_manager = WebSocketManager() 