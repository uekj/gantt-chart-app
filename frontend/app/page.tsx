'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task, Project } from '../../shared/types';
import GanttChart from '../components/GanttChart';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';
import { useProjects } from '../hooks/useProjects';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    projects,
    tasks,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useProjects();
  
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModalProjectId, setTaskModalProjectId] = useState<number | undefined>(undefined);

  const getTasksForProject = (projectId: number) => {
    return tasks.filter(task => task.project_id === projectId);
  };

  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Project handlers
  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleProjectSave = async (projectData: Omit<Project, 'id'> | Partial<Project>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData as Partial<Project>);
    } else {
      await createProject(projectData as Omit<Project, 'id'>);
    }
  };

  const handleProjectDelete = async (projectId: number) => {
    await deleteProject(projectId);
    if (selectedProject === projectId) {
      setSelectedProject(null);
    }
  };

  // Task handlers
  const handleCreateTask = (projectId: number) => {
    setEditingTask(null);
    setTaskModalProjectId(projectId);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalProjectId(undefined);
    setTaskModalOpen(true);
  };

  const handleTaskSave = async (taskData: Omit<Task, 'id'> | Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData as Partial<Task>);
    } else {
      await createTask(taskData as Omit<Task, 'id'>);
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    await deleteTask(taskId);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // 未認証時は自動的にサインインページにリダイレクト
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  // 認証中または未認証時はnullを返す（リダイレクトのため表示不要）
  if (status !== 'authenticated') {
    return null;
  }

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込んでいます...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        {error && (
          <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <p className="text-sm">⚠️ サーバーに接続できません。モックデータを表示しています。</p>
          </div>
        )}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Gantt Chart App</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">
                {session?.user?.name || session?.user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button 
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('day')}
          >
            日表示
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('week')}
          >
            週表示
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Project & Task List */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">プロジェクト</h2>
              <button 
                onClick={handleCreateProject}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                + 新規
              </button>
            </div>
            
            {projects.map(project => (
              <div key={project.id} className="mb-4 border border-gray-200 rounded-lg bg-white">
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedProject === project.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{project.name}</h3>
                      <span className="text-xs text-gray-500">{project.start_date}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                      className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    >
                      編集
                    </button>
                  </div>
                </div>
                
                {selectedProject === project.id && (
                  <div className="border-t border-gray-200">
                    <div className="p-2 bg-gray-50 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">タスク</span>
                      <button 
                        onClick={() => handleCreateTask(project.id)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        + 追加
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {getTasksForProject(project.id).map(task => (
                        <div 
                          key={task.id} 
                          className="p-2 border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEditTask(task)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">{task.name}</div>
                              <div className="text-xs text-gray-500">
                                {task.start_date} 〜 {task.end_date}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                              }}
                              className="ml-2 px-1 py-1 text-xs text-gray-400 hover:text-gray-600"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Gantt Chart Area */}
        <div className="flex-1 bg-white overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">ガントチャート</h2>
            </div>
            <div className="flex-1 overflow-auto">
              <GanttChart 
                projects={projects} 
                tasks={tasks} 
                viewMode={viewMode}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleProjectSave}
        onDelete={handleProjectDelete}
        project={editingProject}
        mode={editingProject ? 'edit' : 'create'}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        task={editingTask}
        projects={projects}
        mode={editingTask ? 'edit' : 'create'}
        defaultProjectId={taskModalProjectId}
      />
    </main>
  );
}