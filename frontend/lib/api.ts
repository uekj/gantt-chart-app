import { Project, Task, APIResponse } from '../../shared/types';

export class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects');
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    const endpoint = projectId ? `/api/tasks?project_id=${projectId}` : '/api/tasks';
    return this.request<Task[]>(endpoint);
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

}

export const apiClient = new ApiClient();