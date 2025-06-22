'use client';

import { useState, useEffect } from 'react';
import { Task, Project } from '../../shared/types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id'> | Partial<Task>) => void;
  onDelete?: (taskId: number) => void;
  task?: Task | null;
  projects: Project[];
  mode: 'create' | 'edit';
  defaultProjectId?: number;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  projects,
  mode,
  defaultProjectId
}) => {
  const [formData, setFormData] = useState({
    project_id: defaultProjectId || 0,
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    display_order: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && task) {
        setFormData({
          project_id: task.project_id,
          name: task.name,
          start_date: task.start_date,
          end_date: task.end_date,
          display_order: task.display_order
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        setFormData({
          project_id: defaultProjectId || (projects.length > 0 ? projects[0].id : 0),
          name: '',
          start_date: today,
          end_date: tomorrowStr,
          display_order: 0
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, task, defaultProjectId, projects]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_id) {
      newErrors.project_id = 'プロジェクトを選択してください';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'タスク名は必須です';
    }

    if (!formData.start_date) {
      newErrors.start_date = '開始日は必須です';
    }

    if (!formData.end_date) {
      newErrors.end_date = '終了日は必須です';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate >= endDate) {
        newErrors.end_date = '終了日は開始日より後の日付を選択してください';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (mode === 'create' && startDate < today) {
        newErrors.start_date = '開始日は今日以降の日付を選択してください';
      }

      // プロジェクト開始日チェック
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (selectedProject) {
        const projectStartDate = new Date(selectedProject.start_date);
        if (startDate < projectStartDate) {
          newErrors.start_date = 'プロジェクト開始日以降の日付を選択してください';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrors({ submit: 'タスクの保存に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      setErrors({ submit: 'タスクの削除に失敗しました' });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {mode === 'create' ? '新規タスク' : 'タスク編集'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト *
              </label>
              <select
                id="project_id"
                value={formData.project_id || 0}
                onChange={(e) => handleInputChange('project_id', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.project_id ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value={0}>プロジェクトを選択</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.project_id && (
                <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                タスク名 *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="タスク名を入力"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                開始日 *
              </label>
              <input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                終了日 *
              </label>
              <input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="display_order" className="block text-sm font-medium text-gray-700 mb-2">
                表示順序
              </label>
              <input
                id="display_order"
                type="number"
                value={formData.display_order || 0}
                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                disabled={isSubmitting}
              />
            </div>

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.submit}
              </div>
            )}

            <div className="flex justify-between">
              <div>
                {mode === 'edit' && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '保存中...' : mode === 'create' ? '作成' : '更新'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">タスクを削除しますか？</h3>
              <p className="text-gray-600 mb-6">この操作は元に戻せません。</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;