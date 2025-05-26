'use client'

import { StarredRepo } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatNumber } from '@/lib/utils'
import { Star, GitFork, Eye, ExternalLink, Calendar } from 'lucide-react'
import Image from 'next/image'

interface RepoCardProps {
  repo: StarredRepo
}

export function RepoCard({ repo }: RepoCardProps) {
  const topics = repo.topics ? JSON.parse(repo.topics) : []

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Image
              src={repo.owner_avatar_url}
              alt={repo.owner_login}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {repo.name}
                </a>
              </CardTitle>
              <CardDescription className="truncate">
                {repo.owner_login}/{repo.name}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {repo.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {repo.description}
          </p>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {repo.language && (
              <Badge variant="secondary" className="text-xs">
                {repo.language}
              </Badge>
            )}
            {repo.is_fork && (
              <Badge variant="outline" className="text-xs">
                Fork
              </Badge>
            )}
            {repo.license_name && (
              <Badge variant="outline" className="text-xs">
                {repo.license_name}
              </Badge>
            )}
          </div>
        </div>
        
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topics.slice(0, 3).map((topic: string) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {topics.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{topics.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Starred {formatDate(repo.starred_at)}</span>
        </div>
      </CardContent>
    </Card>
  )
} 