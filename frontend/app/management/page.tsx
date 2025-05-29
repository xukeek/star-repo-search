'use client'

import { SyncStatus } from '@/components/sync-status'
import { ReadmeManager } from '@/components/readme-manager'
import { Navigation } from '@/components/navigation'

export default function ManagementPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">系统管理</h1>
          <p className="text-muted-foreground">
            管理GitHub仓库同步和README处理任务
          </p>
        </div>
        
        <div className="space-y-8">
          <SyncStatus />
          <ReadmeManager />
        </div>
      </div>
    </div>
  )
} 