'use client';

import { useState, useEffect } from 'react';
import { Project } from '../../shared/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'> | Partial<Project>) => void;
  onDelete?: (projectId: number) => void;
  project?: Project | null;
  mode: 'create' | 'edit';
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  project,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    display_order: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && project) {
        setFormData({
          name: project.name || '',
          start_date: project.start_date || new Date().toISOString().split('T')[0],
          display_order: project.display_order || 0
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          name: '',
          start_date: today,
          display_order: 0
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です';
    }

    if (!formData.start_date) {
      newErrors.start_date = '開始日は必須です';
    } else {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (mode === 'create' && startDate < today) {
        newErrors.start_date = '開始日は今日以降の日付を選択してください';
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
      console.error('Failed to save project:', error);
      setErrors({ submit: 'プロジェクトの保存に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete project:', error);
      setErrors({ submit: 'プロジェクトの削除に失敗しました' });
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" data-testid="project-modal">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {mode === 'create' ? '新規プロジェクト' : 'プロジェクト編集'}
            </h2>
            <button
              onClick={onClose}
              data-testid="close-modal-button"
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名 *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                data-testid="project-name-input"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="プロジェクト名を入力"
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
                data-testid="project-start-date-input"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
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
                    data-testid="delete-project-button"
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
                  data-testid="save-project-button"
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">プロジェクトを削除しますか？</h3>
              <p className="text-gray-600 mb-6">関連するタスクもすべて削除されます。この操作は元に戻せません。</p>
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

export default ProjectModal;