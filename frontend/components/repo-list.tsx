'use client'

import { StarredRepo } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatNumber } from '@/lib/utils'
import { Star, GitFork, Eye, ExternalLink, Calendar, Code } from 'lucide-react'
import Image from 'next/image'

interface RepoListProps {
  repos: StarredRepo[]
}

export function RepoList({ repos }: RepoListProps) {
  return (
    <div className="space-y-4">
      {repos.map((repo) => {
        const topics = repo.topics ? JSON.parse(repo.topics) : []
        
        return (
          <div
            key={repo.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 min-w-0 flex-1">
                {/* 头像 */}
                <Image
                  src={repo.owner_avatar_url}
                  alt={repo.owner_login}
                  width={48}
                  height={48}
                  className="rounded-full flex-shrink-0"
                />
                
                {/* 主要信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold truncate">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {repo.full_name}
                      </a>
                    </h3>
                    {repo.is_fork && (
                      <Badge variant="outline" className="text-xs">
                        Fork
                      </Badge>
                    )}
                    {repo.is_private && (
                      <Badge variant="secondary" className="text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  {/* 统计信息 */}
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>{formatNumber(repo.stargazers_count)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="h-4 w-4" />
                      <span>{formatNumber(repo.forks_count)}</span>
                    </div>
                    {repo.open_issues_count > 0 && (
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{formatNumber(repo.open_issues_count)}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Starred {formatDate(repo.starred_at)}</span>
                    </div>
                  </div>
                  
                  {/* 标签和语言 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                          <Code className="h-3 w-3 mr-1" />
                          {repo.language}
                        </Badge>
                      )}
                      {repo.license_name && (
                        <Badge variant="outline" className="text-xs">
                          {repo.license_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* 主题标签 */}
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {topics.slice(0, 5).map((topic: string) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {topics.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{topics.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
} 