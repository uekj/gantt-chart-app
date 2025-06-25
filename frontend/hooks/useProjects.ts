import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Project, Task } from '../../shared/types';
import { apiClient } from '../lib/api';

export const useProjects = () => {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // データを取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, tasksData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getTasks(),
      ]);
      
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      
      // 401エラー（認証なし）の場合は特別なエラーメッセージ
      if (err instanceof Error && err.message.includes('401')) {
        setError('認証が必要です');
      } else {
        setError('サーバーに接続できません。モックデータを表示しています。');
      }
      
      // フォールバック：モックデータを使用
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const mockProjects: Project[] = [
        { id: 1, name: 'Webサイトリニューアル', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, display_order: 0 },
        { id: 2, name: 'モバイルアプリ開発', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, display_order: 1 },
      ];
      
      const mockTasks: Task[] = [
        { id: 1, project_id: 1, name: '要件定義', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-07`, display_order: 0 },
        { id: 2, project_id: 1, name: '設計', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-08`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-21`, display_order: 1 },
        { id: 3, project_id: 2, name: '調査', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`, display_order: 0 },
      ];
      
      setProjects(mockProjects);
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  // プロジェクト作成
  const createProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    if (status !== 'authenticated') {
      throw new Error('認証が必要です');
    }
    try {
      const newProject = await apiClient.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }, [status]);

  // プロジェクト更新
  const updateProject = useCallback(async (id: number, updates: Partial<Project>) => {
    if (status !== 'authenticated') {
      // 未認証時はローカル更新のみ
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return;
    }
    try {
      const updatedProject = await apiClient.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Failed to update project:', err);
      // ローカル更新にフォールバック
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      throw err;
    }
  }, [status]);

  // プロジェクト削除
  const deleteProject = useCallback(async (id: number) => {
    try {
      await apiClient.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.project_id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }, []);

  // タスク作成
  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    try {
      const newTask = await apiClient.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  }, []);

  // タスク更新
  const updateTask = useCallback(async (id: number, updates: Partial<Task>) => {
    try {
      const updatedTask = await apiClient.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      console.error('Failed to update task:', err);
      // ローカル更新にフォールバック
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      throw err;
    }
  }, []);

  // タスク削除
  const deleteTask = useCallback(async (id: number) => {
    try {
      await apiClient.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      throw err;
    }
  }, []);

  // 認証完了後にデータ取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    } else if (status === 'unauthenticated') {
      // 未認証の場合はモックデータをすぐに表示
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const mockProjects: Project[] = [
        { id: 1, name: 'Webサイトリニューアル', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, display_order: 0 },
        { id: 2, name: 'モバイルアプリ開発', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, display_order: 1 },
      ];
      
      const mockTasks: Task[] = [
        { id: 1, project_id: 1, name: '要件定義', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-07`, display_order: 0 },
        { id: 2, project_id: 1, name: '設計', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-08`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-21`, display_order: 1 },
        { id: 3, project_id: 2, name: '調査', start_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-15`, end_date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-20`, display_order: 0 },
      ];
      
      setProjects(mockProjects);
      setTasks(mockTasks);
      setError('認証が必要です');
      setLoading(false);
    }
  }, [status, fetchData]);

  return {
    projects,
    tasks,
    loading,
    error,
    fetchData,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    setProjects,
    setTasks,
  };
};