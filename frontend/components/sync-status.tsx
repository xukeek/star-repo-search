'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { useWebSocket, getWebSocketUrl, type ConnectionStatus } from '@/lib/websocket'

interface SyncStatusProps {
  className?: string
}

export function SyncStatus({ className }: SyncStatusProps) {
  const {
    connectionStatus,
    syncStatus,
    syncProgress,
    isConnected
  } = useWebSocket(getWebSocketUrl('/ws/sync'))

  // 连接状态指示器
  const getConnectionIndicator = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return '已连接'
      case 'connecting':
        return '连接中...'
      case 'disconnected':
        return '未连接'
      case 'error':
        return '连接错误'
      default:
        return '未知状态'
    }
  }

  // 如果没有同步状态数据且未连接，不显示组件
  if (!syncStatus && !isConnected) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className={`h-5 w-5 ${syncStatus?.is_syncing ? 'animate-spin' : ''}`} />
            <span>同步状态</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {getConnectionIndicator(connectionStatus)}
            <span className="text-muted-foreground">
              {getConnectionText(connectionStatus)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus && (
          <>
            {/* 基本状态信息 */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{syncStatus.message}</p>
                {syncStatus.last_sync && (
                  <p className="text-xs text-muted-foreground">
                    上次同步: {new Date(syncStatus.last_sync).toLocaleString('zh-CN')}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  总仓库数: {syncStatus.total_repos.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {syncStatus.is_syncing && (
                  <Badge variant="secondary" className="animate-pulse">
                    同步中
                  </Badge>
                )}
                {!syncStatus.is_syncing && syncStatus.total_repos > 0 && (
                  <Badge variant="outline">
                    已完成
                  </Badge>
                )}
              </div>
            </div>

            {/* 同步进度 */}
            {syncStatus.is_syncing && syncProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">同步进度</span>
                  <span className="font-medium">
                    {syncProgress.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={syncProgress.percentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{syncProgress.message}</span>
                  <span>
                    {syncProgress.current.toLocaleString()} / {syncProgress.total.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* 连接状态为错误时的提示 */}
        {connectionStatus === 'error' && (
          <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>WebSocket连接失败，无法实时更新同步状态</span>
          </div>
        )}

        {/* 连接中的提示 */}
        {connectionStatus === 'connecting' && (
          <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>正在连接到服务器...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 