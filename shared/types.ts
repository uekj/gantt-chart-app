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

