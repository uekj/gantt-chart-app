export interface Project {
  id: number;
  name: string;
  start_date: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  name: string;
  start_date: string;
  end_date: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface MCPOperation {
  operation: 'list_projects' | 'create_project' | 'create_task' | 'update_task_dates';
  data?: any;
}

export interface APIResponse<T = any> {
  result?: T;
  error?: string;
  message?: string;
}