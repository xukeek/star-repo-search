'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RepoCard } from '@/components/repo-card'
import { SearchFilters } from '@/components/search-filters'
import { 
  searchRepos, 
  syncRepos, 
  getSyncStatus, 
  getStats,
  SearchParams, 
  SearchResponse, 
  SyncStatus,
  Stats
} from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { 
  RefreshCw, 
  Database, 
  Star, 
  GitFork, 
  Code, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Github
} from 'lucide-react'

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [currentParams, setCurrentParams] = useState<SearchParams>({ page: 1, per_page: 20 })

  // 加载初始数据
  useEffect(() => {
    loadInitialData()
    loadSyncStatus()
    
    // 定期检查同步状态
    const interval = setInterval(loadSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [searchData, statsData] = await Promise.all([
        searchRepos({ page: 1, per_page: 20 }),
        getStats()
      ])
      setSearchResults(searchData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus()
      setSyncStatus(status)
      setSyncing(status.is_syncing)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const handleSearch = async (params: SearchParams) => {
    setLoading(true)
    setCurrentParams(params)
    try {
      const results = await searchRepos(params)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncRepos()
      // 同步开始后，定期检查状态
      const checkStatus = setInterval(async () => {
        const status = await getSyncStatus()
        setSyncStatus(status)
        if (!status.is_syncing) {
          clearInterval(checkStatus)
          setSyncing(false)
          // 同步完成后重新加载数据
          loadInitialData()
        }
      }, 2000)
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncing(false)
    }
  }

  const handlePageChange = (page: number) => {
    const newParams = { ...currentParams, page }
    handleSearch(newParams)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Github className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Star Repo Search</h1>
                <p className="text-muted-foreground">搜索你的 GitHub starred 仓库</p>
              </div>
            </div>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="flex items-center space-x-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{syncing ? '同步中...' : '同步仓库'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总仓库数</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.total_repos)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总 Stars</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.total_stars)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总 Forks</CardTitle>
                <GitFork className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.total_forks)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">热门语言</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {stats.top_languages.slice(0, 3).map((lang) => (
                    <Badge key={lang.language} variant="secondary" className="text-xs">
                      {lang.language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 同步状态 */}
        {syncStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className={`h-5 w-5 ${syncStatus.is_syncing ? 'animate-spin' : ''}`} />
                <span>同步状态</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{syncStatus.message}</p>
                  {syncStatus.last_sync && (
                    <p className="text-xs text-muted-foreground mt-1">
                      上次同步: {new Date(syncStatus.last_sync).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
                {syncStatus.is_syncing && (
                  <Badge variant="secondary">同步中</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索过滤器 */}
        <SearchFilters onSearch={handleSearch} loading={loading} />

        {/* 搜索结果 */}
        {searchResults && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                搜索结果 ({formatNumber(searchResults.total)} 个仓库)
              </h2>
              
              {/* 分页控制 */}
              {searchResults.total_pages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResults.page - 1)}
                    disabled={searchResults.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    第 {searchResults.page} 页，共 {searchResults.total_pages} 页
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResults.page + 1)}
                    disabled={searchResults.page >= searchResults.total_pages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 仓库列表 */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : searchResults.repos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">没有找到匹配的仓库</p>
                <p className="text-sm text-muted-foreground mt-2">
                  尝试调整搜索条件或先同步你的 starred 仓库
                </p>
              </div>
            )}

            {/* 底部分页 */}
            {searchResults.total_pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(searchResults.page - 1)}
                    disabled={searchResults.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    上一页
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-4">
                    第 {searchResults.page} 页，共 {searchResults.total_pages} 页
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(searchResults.page + 1)}
                    disabled={searchResults.page >= searchResults.total_pages || loading}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}