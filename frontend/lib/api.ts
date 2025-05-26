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
  has_topics?: boolean
  is_fork?: boolean
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