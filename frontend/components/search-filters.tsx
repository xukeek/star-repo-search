'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchParams, getLanguages, getOwners } from '@/lib/api'
import { Search, Filter, X, Calendar, ArrowUpDown } from 'lucide-react'

interface SearchFiltersProps {
  onSearch: (params: SearchParams) => void
  loading?: boolean
}

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [owner, setOwner] = useState('')
  const [minStars, setMinStars] = useState('')
  const [maxStars, setMaxStars] = useState('')
  const [starredAfter, setStarredAfter] = useState('')
  const [starredBefore, setStarredBefore] = useState('')
  const [sortBy, setSortBy] = useState<string>('starred_at')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [hasTopics, setHasTopics] = useState<boolean | undefined>(undefined)
  const [isFork, setIsFork] = useState<boolean | undefined>(undefined)
  
  const [languages, setLanguages] = useState<string[]>([])
  const [owners, setOwners] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [languagesData, ownersData] = await Promise.all([
          getLanguages(),
          getOwners()
        ])
        setLanguages(languagesData.slice(0, 20)) // 限制显示数量
        setOwners(ownersData.slice(0, 20))
      } catch (error) {
        console.error('Failed to load filter options:', error)
      }
    }
    loadFilterOptions()
  }, [])

  const handleSearch = () => {
    const params: SearchParams = {
      query: query || undefined,
      language: language || undefined,
      owner: owner || undefined,
      min_stars: minStars ? parseInt(minStars) : undefined,
      max_stars: maxStars ? parseInt(maxStars) : undefined,
      starred_after: starredAfter || undefined,
      starred_before: starredBefore || undefined,
      sort_by: sortBy as any,
      sort_order: sortOrder as any,
      has_topics: hasTopics,
      is_fork: isFork,
      page: 1,
      per_page: 20
    }
    onSearch(params)
  }

  const clearFilters = () => {
    setQuery('')
    setLanguage('')
    setOwner('')
    setMinStars('')
    setMaxStars('')
    setStarredAfter('')
    setStarredBefore('')
    setSortBy('starred_at')
    setSortOrder('desc')
    setHasTopics(undefined)
    setIsFork(undefined)
    onSearch({ page: 1, per_page: 20 })
  }

  const hasActiveFilters = query || language || owner || minStars || maxStars || 
    starredAfter || starredBefore || hasTopics !== undefined || isFork !== undefined ||
    sortBy !== 'starred_at' || sortOrder !== 'desc'

  return (
    <div className="space-y-4">
      {/* 主搜索框和排序 */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索仓库名称、描述或主题..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        
        {/* 排序选择器 */}
        <div className="flex space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starred_at">Star 时间</SelectItem>
              <SelectItem value="stargazers_count">Star 数量</SelectItem>
              <SelectItem value="forks_count">Fork 数量</SelectItem>
              <SelectItem value="created_at">创建时间</SelectItem>
              <SelectItem value="updated_at">更新时间</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">降序</SelectItem>
              <SelectItem value="asc">升序</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleSearch} disabled={loading}>
          搜索
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          过滤器
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            清除
          </Button>
        )}
      </div>

      {/* 高级过滤器 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">高级过滤器</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 编程语言 */}
              <div>
                <label className="text-sm font-medium mb-2 block">编程语言</label>
                <Input
                  placeholder="选择语言..."
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  list="languages"
                />
                <datalist id="languages">
                  {languages.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
              </div>

              {/* 仓库所有者 */}
              <div>
                <label className="text-sm font-medium mb-2 block">仓库所有者</label>
                <Input
                  placeholder="选择所有者..."
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  list="owners"
                />
                <datalist id="owners">
                  {owners.map((ownerName) => (
                    <option key={ownerName} value={ownerName} />
                  ))}
                </datalist>
              </div>

              {/* Star 数量范围 */}
              <div>
                <label className="text-sm font-medium mb-2 block">Star 数量</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="最小"
                    type="number"
                    value={minStars}
                    onChange={(e) => setMinStars(e.target.value)}
                  />
                  <Input
                    placeholder="最大"
                    type="number"
                    value={maxStars}
                    onChange={(e) => setMaxStars(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Star 时间范围 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Star 开始时间
                </label>
                <Input
                  type="date"
                  value={starredAfter}
                  onChange={(e) => setStarredAfter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Star 结束时间
                </label>
                <Input
                  type="date"
                  value={starredBefore}
                  onChange={(e) => setStarredBefore(e.target.value)}
                />
              </div>
            </div>

            {/* 布尔过滤器 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">有主题:</label>
                <div className="flex space-x-1">
                  <Button
                    variant={hasTopics === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasTopics(hasTopics === true ? undefined : true)}
                  >
                    是
                  </Button>
                  <Button
                    variant={hasTopics === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHasTopics(hasTopics === false ? undefined : false)}
                  >
                    否
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Fork 仓库:</label>
                <div className="flex space-x-1">
                  <Button
                    variant={isFork === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsFork(isFork === true ? undefined : true)}
                  >
                    是
                  </Button>
                  <Button
                    variant={isFork === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsFork(isFork === false ? undefined : false)}
                  >
                    否
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                重置
              </Button>
              <Button onClick={handleSearch} disabled={loading}>
                应用过滤器
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 活跃过滤器显示 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <Badge variant="secondary">
              搜索: {query}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setQuery('')}
              />
            </Badge>
          )}
          {language && (
            <Badge variant="secondary">
              语言: {language}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setLanguage('')}
              />
            </Badge>
          )}
          {owner && (
            <Badge variant="secondary">
              所有者: {owner}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setOwner('')}
              />
            </Badge>
          )}
          {minStars && (
            <Badge variant="secondary">
              最小 Stars: {minStars}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setMinStars('')}
              />
            </Badge>
          )}
          {maxStars && (
            <Badge variant="secondary">
              最大 Stars: {maxStars}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setMaxStars('')}
              />
            </Badge>
          )}
          {starredAfter && (
            <Badge variant="secondary">
              Star 开始: {starredAfter}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setStarredAfter('')}
              />
            </Badge>
          )}
          {starredBefore && (
            <Badge variant="secondary">
              Star 结束: {starredBefore}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setStarredBefore('')}
              />
            </Badge>
          )}
          {(sortBy !== 'starred_at' || sortOrder !== 'desc') && (
            <Badge variant="secondary">
              排序: {sortBy === 'starred_at' ? 'Star时间' : 
                     sortBy === 'stargazers_count' ? 'Star数量' :
                     sortBy === 'forks_count' ? 'Fork数量' :
                     sortBy === 'created_at' ? '创建时间' : '更新时间'} 
              ({sortOrder === 'desc' ? '降序' : '升序'})
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setSortBy('starred_at')
                  setSortOrder('desc')
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 