'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RepoCard } from '@/components/repo-card'
import { RepoList } from '@/components/repo-list'
import { SearchFilters } from '@/components/search-filters'
import { 
  searchRepos, 
  syncRepos, 
  getStats,
  SearchParams, 
  SearchResponse, 
  SyncStatus as SyncStatusType,
  Stats
} from '@/lib/api'
import { SyncStatus } from '@/components/sync-status'
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
  Github,
  Grid3X3,
  List,
  MoreHorizontal
} from 'lucide-react'

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pageSize, setPageSize] = useState(20)
  const [currentParams, setCurrentParams] = useState<SearchParams>({ page: 1, per_page: 20 })

  // 加载初始数据
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [searchData, statsData] = await Promise.all([
        searchRepos({ page: 1, per_page: pageSize }),
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

  const handleSearch = async (params: SearchParams) => {
    setLoading(true)
    const searchParams = { ...params, per_page: pageSize }
    setCurrentParams(searchParams)
    try {
      const results = await searchRepos(searchParams)
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
      // WebSocket会自动处理同步状态更新
      // 同步完成后会通过WebSocket通知，这里只需要重新加载数据
      setTimeout(() => {
        setSyncing(false)
        loadInitialData()
      }, 1000)
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncing(false)
    }
  }

  const handlePageChange = (page: number) => {
    const newParams = { ...currentParams, page, per_page: pageSize }
    handleSearch(newParams)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize)
    setPageSize(size)
    const newParams = { ...currentParams, page: 1, per_page: size }
    handleSearch(newParams)
  }

  // 生成分页按钮
  const generatePaginationButtons = () => {
    if (!searchResults || searchResults.total_pages <= 1) return []
    
    const current = searchResults.page
    const total = searchResults.total_pages
    const buttons = []
    
    // 总是显示第一页
    if (current > 3) {
      buttons.push(1)
      if (current > 4) {
        buttons.push('...')
      }
    }
    
    // 显示当前页附近的页面
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      buttons.push(i)
    }
    
    // 总是显示最后一页
    if (current < total - 2) {
      if (current < total - 3) {
        buttons.push('...')
      }
      buttons.push(total)
    }
    
    return buttons
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

        {/* 同步状态 - 使用WebSocket实时更新 */}
        <SyncStatus className="mb-6" />

        {/* 搜索过滤器 */}
        <SearchFilters onSearch={handleSearch} loading={loading} />

        {/* 搜索结果 */}
        {searchResults && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                搜索结果 ({formatNumber(searchResults.total)} 个仓库)
              </h2>
              
              {/* 视图控制 */}
              <div className="flex items-center space-x-4">
                {/* 每页显示数量 */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">每页显示:</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 视图模式切换 */}
                <div className="flex items-center space-x-1 border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 仓库列表 */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : searchResults.repos.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.repos.map((repo) => (
                      <RepoCard key={repo.id} repo={repo} />
                    ))}
                  </div>
                ) : (
                  <RepoList repos={searchResults.repos} />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">没有找到匹配的仓库</p>
                <p className="text-sm text-muted-foreground mt-2">
                  尝试调整搜索条件或先同步你的 starred 仓库
                </p>
              </div>
            )}

            {/* 改进的分页控制 */}
            {searchResults.total_pages > 1 && (
              <div className="flex flex-col items-center space-y-4 mt-8">
                {/* 分页信息 */}
                <div className="text-sm text-muted-foreground">
                  显示第 {((searchResults.page - 1) * searchResults.per_page) + 1} - {Math.min(searchResults.page * searchResults.per_page, searchResults.total)} 条，
                  共 {formatNumber(searchResults.total)} 条记录
                </div>
                
                {/* 分页按钮 */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResults.page - 1)}
                    disabled={searchResults.page <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  
                  {generatePaginationButtons().map((pageNum, index) => (
                    <Button
                      key={index}
                      variant={pageNum === searchResults.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                      disabled={typeof pageNum !== 'number' || loading}
                      className={typeof pageNum === 'string' ? 'cursor-default' : ''}
                    >
                      {pageNum === '...' ? <MoreHorizontal className="h-4 w-4" /> : pageNum}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResults.page + 1)}
                    disabled={searchResults.page >= searchResults.total_pages || loading}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* 快速跳转 */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">跳转到第</span>
                  <input
                    type="number"
                    min="1"
                    max={searchResults.total_pages}
                    className="w-16 px-2 py-1 border rounded text-center"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt((e.target as HTMLInputElement).value)
                        if (page >= 1 && page <= searchResults.total_pages) {
                          handlePageChange(page)
                        }
                      }
                    }}
                  />
                  <span className="text-muted-foreground">页</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}