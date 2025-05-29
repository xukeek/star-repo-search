import { useEffect, useRef, useState, useCallback } from 'react'

// WebSocket消息类型
export interface WebSocketMessage {
  type: 'sync_status' | 'sync_progress' | 'readme_status' | 'heartbeat' | 'error'
  data: any
  timestamp: string
}

// 同步进度数据
export interface SyncProgress {
  current: number
  total: number
  percentage: number
  message: string
}

// 同步状态数据
export interface SyncStatus {
  is_syncing: boolean
  last_sync?: string
  total_repos: number
  message: string
}

// README处理状态数据
export interface ReadmeProcessStatus {
  is_processing: boolean
  last_run?: string
  next_run?: string
  total_processed: number
  message: string
}

// WebSocket连接状态
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// WebSocket Hook
export function useWebSocket(url: string) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [readmeStatus, setReadmeStatus] = useState<ReadmeProcessStatus | null>(null)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionStatus('connecting')
    
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log('WebSocket连接已建立')
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        // 启动心跳
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping')
          }
        }, 30000)
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          switch (message.type) {
            case 'sync_status':
              setSyncStatus(message.data)
              break
            case 'sync_progress':
              setSyncProgress(message.data)
              break
            case 'readme_status':
              setReadmeStatus(message.data)
              break
            case 'heartbeat':
              // 心跳包，不需要特殊处理
              break
            case 'error':
              console.error('WebSocket错误消息:', message.data)
              break
            default:
              console.warn('未知的WebSocket消息类型:', message.type)
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket连接已关闭:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        // 清理心跳
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }
        
        // 尝试重连
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`${delay}ms后尝试重连...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          console.error('达到最大重连次数，停止重连')
          setConnectionStatus('error')
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket错误:', error)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('创建WebSocket连接失败:', error)
      setConnectionStatus('error')
    }
  }, [url])

  const disconnect = useCallback(() => {
    // 清理重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // 清理心跳定时器
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    // 关闭WebSocket连接
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
  }, [])

  const sendMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message)
      return true
    }
    return false
  }, [])

  // 组件挂载时自动连接
  useEffect(() => {
    connect()
    
    // 组件卸载时断开连接
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    connectionStatus,
    syncStatus,
    syncProgress,
    readmeStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  }
}

// WebSocket URL构建函数
export function getWebSocketUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const wsUrl = baseUrl.replace(/^http/, 'ws')
  return `${wsUrl}${path}`
} 