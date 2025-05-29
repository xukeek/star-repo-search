import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

export interface StarredRepo {
  id: number
  repo_id: number
  name: string
  full_name: string
  description?: string
  html_url: string
  clone_url: string
  ssh_url: string
  language?: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  topics?: string
  owner_login: string
  owner_avatar_url: string
  starred_at: string
  created_at: string
  updated_at: string
  is_fork: boolean
  is_private: boolean
  size: number
  default_branch: string
  license_name?: string
  license_key?: string
}

export interface SearchParams {
  query?: string
  language?: string
  owner?: string
  min_stars?: number
  max_stars?: number
  starred_after?: string
  starred_before?: string
  has_topics?: boolean
  is_fork?: boolean
  sort_by?: 'starred_at' | 'stargazers_count' | 'forks_count' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface SearchResponse {
  repos: StarredRepo[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface SyncStatus {
  is_syncing: boolean
  last_sync?: string
  total_repos: number
  message: string
}

export interface SyncProgress {
  current: number
  total: number
  percentage: number
  message: string
}

export interface Stats {
  total_repos: number
  total_stars: number
  total_forks: number
  top_languages: Array<{
    language: string
    count: number
  }>
}

// API 函数
export const searchRepos = async (params: SearchParams): Promise<SearchResponse> => {
  const response = await api.get('/repos/search', { params })
  return response.data
}

export const syncRepos = async (username?: string): Promise<SyncStatus> => {
  const response = await api.post('/sync', username ? { username } : {})
  return response.data
}

export const getSyncStatus = async (): Promise<SyncStatus> => {
  const response = await api.get('/sync/status')
  return response.data
}

export const getRepo = async (repoId: number): Promise<StarredRepo> => {
  const response = await api.get(`/repos/${repoId}`)
  return response.data
}

export const getLanguages = async (): Promise<string[]> => {
  const response = await api.get('/languages')
  return response.data
}

export const getOwners = async (): Promise<string[]> => {
  const response = await api.get('/owners')
  return response.data
}

export const getStats = async (): Promise<Stats> => {
  const response = await api.get('/stats')
  return response.data
}

export const deleteAllRepos = async (): Promise<{ message: string }> => {
  const response = await api.delete('/repos')
  return response.data
}

export const getGitHubUser = async () => {
  const response = await api.get('/github/user')
  return response.data
}

export const getGitHubRateLimit = async () => {
  const response = await api.get('/github/rate-limit')
  return response.data
}

// README处理相关接口
export interface ReadmeStats {
  total_repos: number
  processed_repos: number
  vector_documents: number
  processing_rate: string
  vector_stats?: {
    total_documents: number
    collection_name: string
  }
}

export interface ReadmeProcessStatus {
  is_processing: boolean
  last_run?: string
  next_run?: string
  total_processed: number
  message: string
}

export interface SchedulerStatus {
  is_running: boolean
  readme_processing: ReadmeProcessStatus
  jobs: Array<{
    id: string
    name: string
    next_run_time?: string
    trigger: string
  }>
}

// README处理API函数
export const processReadmes = async (maxRepos?: number): Promise<{ message: string; max_repos?: number }> => {
  const response = await api.post('/readmes/process', maxRepos ? { max_repos: maxRepos } : {})
  return response.data
}

export const getReadmeStats = async (): Promise<ReadmeStats> => {
  const response = await api.get('/readmes/stats')
  return response.data
}

export const getSchedulerStatus = async (): Promise<SchedulerStatus> => {
  const response = await api.get('/scheduler/status')
  return response.data
}

export const startScheduler = async (): Promise<{ message: string }> => {
  const response = await api.post('/scheduler/start')
  return response.data
}

export const stopScheduler = async (): Promise<{ message: string }> => {
  const response = await api.post('/scheduler/stop')
  return response.data
} 