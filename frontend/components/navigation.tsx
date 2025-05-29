'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Github, Home, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Github className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Star Repo Search</h1>
              <p className="text-sm text-muted-foreground">搜索你的 GitHub starred 仓库</p>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-2">
            <Link href="/">
              <Button 
                variant={pathname === '/' ? 'default' : 'ghost'}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>首页</span>
              </Button>
            </Link>
            <Link href="/management">
              <Button 
                variant={pathname === '/management' ? 'default' : 'ghost'}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>系统管理</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 