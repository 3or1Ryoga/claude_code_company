// Project type definitions for AI LP Generator

export interface Project {
  id: string
  name: string
  concept: string
  description: string | null
  code: string
  dependencies: string[]
  created_at: string
  updated_at: string
}

export interface CreateProjectRequest {
  name: string
  concept: string
  description?: string | null
  code: string
  dependencies?: string[]
}

export interface UpdateProjectRequest {
  id: string
  name?: string
  concept?: string
  description?: string | null
  code?: string
  dependencies?: string[]
}

export interface ProjectsListResponse {
  success: boolean
  data: Project[]
  total: number
  limit: number
  offset: number
}

export interface ProjectResponse {
  success: boolean
  data: Project
  message?: string
}

export interface GenerateRequest {
  concept: string
  description?: string
  saveProject?: boolean
  projectName?: string
}

export interface GenerateResponse {
  success: boolean
  code: string
  dependencies: string[]
  concept: string
  description: string | null
  saved?: boolean
  project?: Project
  message?: string
  saveError?: string
}