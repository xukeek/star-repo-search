'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  processReadmes, 
  getReadmeStats, 
  getSchedulerStatus,
  ReadmeStats,
  SchedulerStatus,
  ReadmeProcessStatus
} from '@/lib/api'
import { useWebSocket, getWebSocketUrl } from '@/lib/websocket'
import { 
  FileText, 
  Play, 
  Loader2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Database,
  Settings,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ReadmeManagerProps {
  onStatusUpdate?: (status: ReadmeProcessStatus) => void
}

export function ReadmeManager({ onStatusUpdate }: ReadmeManagerProps) {
  const [stats, setStats] = useState<ReadmeStats | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null)
  const [processing, setProcessing] = useState(false)
  const [maxRepos, setMaxRepos] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // 使用WebSocket获取实时状态更新
  const {
    connectionStatus,
    readmeStatus,
    isConnected
  } = useWebSocket(getWebSocketUrl('/ws/sync'))

  useEffect(() => {
    loadData()
    // 每60秒刷新一次统计数据（非状态数据）
    const interval = setInterval(() => {
      loadStats()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // 当WebSocket状态更新时，同步到本地状态
  useEffect(() => {
    if (readmeStatus) {
      setProcessing(readmeStatus.is_processing)
      if (onStatusUpdate) {
        onStatusUpdate(readmeStatus)
      }
    }
  }, [readmeStatus, onStatusUpdate])

  const loadData = async () => {
    try {
      const [statsData, statusData] = await Promise.all([
        getReadmeStats(),
        getSchedulerStatus()
      ])
      setStats(statsData)
      setSchedulerStatus(statusData)
      // 如果WebSocket没有提供状态，使用API获取的状态
      if (!readmeStatus) {
        setProcessing(statusData.readme_processing.is_processing)
      }
    } catch (error) {
      console.error('Failed to load README data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getReadmeStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load README stats:', error)
    }
  }

  const handleProcessReadmes = async () => {
    if (processing) return

    setProcessing(true)
    try {
      const maxReposNum = maxRepos ? parseInt(maxRepos) : undefined
      await processReadmes(maxReposNum)
      
      // 立即刷新统计数据
      setTimeout(loadStats, 1000)
    } catch (error) {
      console.error('Failed to process READMEs:', error)
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: ReadmeProcessStatus) => {
    if (status.is_processing) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    if (status.message.includes('完成')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (status.message.includes('失败')) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-gray-500" />
  }

  const getStatusBadgeVariant = (status: ReadmeProcessStatus) => {
    if (status.is_processing) return 'default'
    if (status.message.includes('完成')) return 'default'
    if (status.message.includes('失败')) return 'destructive'
    return 'secondary'
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '未知'
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    } catch {
      return '未知'
    }
  }

  const getProcessingProgress = () => {
    if (!stats) return 0
    return Math.round((stats.processed_repos / stats.total_repos) * 100)
  }

  // 获取当前README处理状态（优先使用WebSocket状态）
  const getCurrentReadmeStatus = (): ReadmeProcessStatus | null => {
    return readmeStatus || schedulerStatus?.readme_processing || null
  }

  // 获取连接状态指示器
  const getConnectionIndicator = () => {
    switch (connectionStatus) {
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

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '实时连接'
      case 'connecting':
        return '连接中...'
      case 'disconnected':
        return '离线模式'
      case 'error':
        return '连接错误'
      default:
        return '未知状态'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>README 处理管理</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>README 处理管理</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {getConnectionIndicator()}
            <span className="text-muted-foreground">
              {getConnectionText()}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          管理仓库 README 文件的处理和语义搜索向量化
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total_repos}</div>
              <div className="text-sm text-muted-foreground">总仓库数</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.processed_repos}</div>
              <div className="text-sm text-muted-foreground">已处理</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.vector_documents}</div>
              <div className="text-sm text-muted-foreground">向量文档</div>
            </div>
          </div>
        )}

        {/* 处理进度 */}
        {stats && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>处理进度</span>
              <span>{stats.processing_rate} ({getProcessingProgress()}%)</span>
            </div>
            <Progress value={getProcessingProgress()} className="h-2" />
          </div>
        )}

        <Separator />

        {/* 当前状态 */}
        {getCurrentReadmeStatus() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>处理状态</span>
              </h4>
              <Badge variant={getStatusBadgeVariant(getCurrentReadmeStatus()!)}>
                {getCurrentReadmeStatus()!.is_processing ? '处理中' : '空闲'}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(getCurrentReadmeStatus()!)}
                <span className="text-sm">{getCurrentReadmeStatus()!.message}</span>
              </div>

              {getCurrentReadmeStatus()!.last_run && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>上次运行: {formatDateTime(getCurrentReadmeStatus()!.last_run)}</span>
                </div>
              )}

              {getCurrentReadmeStatus()!.next_run && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>下次运行: {formatDateTime(getCurrentReadmeStatus()!.next_run)}</span>
                </div>
              )}

              {getCurrentReadmeStatus()!.total_processed > 0 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Database className="h-4 w-4" />
                  <span>本次已处理: {getCurrentReadmeStatus()!.total_processed} 个</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* 手动触发 */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>手动处理</span>
          </h4>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="maxRepos">限制处理数量（可选）</Label>
              <Input
                id="maxRepos"
                type="number"
                placeholder="留空处理所有仓库"
                value={maxRepos}
                onChange={(e) => setMaxRepos(e.target.value)}
                disabled={processing}
                min="1"
                max="1000"
              />
              <p className="text-xs text-muted-foreground">
                建议首次处理时设置较小的数量（如50-100）进行测试
              </p>
            </div>

            <Button 
              onClick={handleProcessReadmes}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  处理中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始处理 README
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 定时任务信息 */}
        {schedulerStatus && schedulerStatus.jobs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">定时任务</h4>
              <div className="space-y-2">
                {schedulerStatus.jobs.map((job) => (
                  <div key={job.id} className="flex justify-between items-center text-sm">
                    <span>{job.name}</span>
                    <span className="text-muted-foreground">
                      {job.next_run_time ? formatDateTime(job.next_run_time) : '未安排'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* WebSocket连接状态提示 */}
        {connectionStatus === 'error' && (
          <>
            <Separator />
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>实时连接失败，状态更新可能延迟。请检查网络连接。</span>
            </div>
          </>
        )}

        {connectionStatus === 'connecting' && (
          <>
            <Separator />
            <div className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>正在建立实时连接...</span>
            </div>
          </>
        )}

        {connectionStatus === 'disconnected' && !isConnected && (
          <>
            <Separator />
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <WifiOff className="h-4 w-4" />
              <span>离线模式：状态更新需要手动刷新页面。</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 