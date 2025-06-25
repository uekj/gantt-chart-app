'use client';

import { useMemo, useState, useCallback } from 'react';
import { Project, Task } from '../../shared/types';

interface GanttChartProps {
  projects: Project[];
  tasks: Task[];
  viewMode: 'day' | 'week';
  onTaskUpdate?: (taskId: number, updates: Partial<Task>) => void;
}

interface DragState {
  isDragging: boolean;
  taskId: number | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  startX: number;
  originalStartDate: string;
  originalEndDate: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

const GanttChart: React.FC<GanttChartProps> = ({ projects, tasks, viewMode, onTaskUpdate }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    taskId: null,
    dragType: null,
    startX: 0,
    originalStartDate: '',
    originalEndDate: '',
  });
  
  // ドラッグ中のローカル状態を管理
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  // 表示期間を計算（3ヶ月分）
  const dateRange = useMemo((): DateRange => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    return { start, end };
  }, []);

  // 日付配列を生成
  const dates = useMemo(() => {
    const dateArray: Date[] = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      dateArray.push(new Date(current));
      if (viewMode === 'day') {
        current.setDate(current.getDate() + 1);
      } else {
        current.setDate(current.getDate() + 7);
      }
    }
    return dateArray;
  }, [dateRange, viewMode]);

  // タスクの位置とサイズを計算
  // tasksが更新されたらlocalTasksも同期
  useMemo(() => {
    if (!dragState.isDragging) {
      setLocalTasks(tasks);
    }
  }, [tasks, dragState.isDragging]);

  const getTaskStyle = (task: Task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    // 開始位置（パーセンテージ）
    const startOffset = Math.max(0, (taskStart.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const leftPercent = (startOffset / totalDays) * 100;
    
    // 幅（パーセンテージ）
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const widthPercent = (duration / totalDays) * 100;
    
    return {
      left: `${leftPercent}%`,
      width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
    };
  };

  // 週末かどうかを判定
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 日曜日(0)または土曜日(6)
  };

  // 日付をフォーマット
  const formatDate = (date: Date) => {
    if (viewMode === 'day') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      const endOfWeek = new Date(date);
      endOfWeek.setDate(date.getDate() + 6);
      return `${date.getMonth() + 1}/${date.getDate()}-${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
    }
  };


  // 日付を文字列形式に変換
  const dateToString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent, task: Task, dragType: 'move' | 'resize-start' | 'resize-end') => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      taskId: task.id,
      dragType,
      startX: e.clientX,
      originalStartDate: task.start_date,
      originalEndDate: task.end_date,
    });
  };

  // ドラッグ中（ローカル状態のみ更新）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.taskId) return;

    const container = document.querySelector('.gantt-body') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const containerWidth = rect.width - 256; // サイドバー幅を除く

    const task = localTasks.find(t => t.id === dragState.taskId);
    if (!task) return;

    const originalStart = new Date(dragState.originalStartDate);
    const originalEnd = new Date(dragState.originalEndDate);
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const dayWidth = containerWidth / totalDays;
    const daysDelta = Math.round(deltaX / dayWidth);

    let newStartDate: Date;
    let newEndDate: Date;

    switch (dragState.dragType) {
      case 'move':
        newStartDate = new Date(originalStart);
        newStartDate.setDate(originalStart.getDate() + daysDelta);
        newEndDate = new Date(originalEnd);
        newEndDate.setDate(originalEnd.getDate() + daysDelta);
        break;
      case 'resize-start':
        newStartDate = new Date(originalStart);
        newStartDate.setDate(originalStart.getDate() + daysDelta);
        newEndDate = new Date(originalEnd);
        if (newStartDate >= newEndDate) {
          newStartDate = new Date(newEndDate);
          newStartDate.setDate(newEndDate.getDate() - 1);
        }
        break;
      case 'resize-end':
        newStartDate = new Date(originalStart);
        newEndDate = new Date(originalEnd);
        newEndDate.setDate(originalEnd.getDate() + daysDelta);
        if (newEndDate <= newStartDate) {
          newEndDate = new Date(newStartDate);
          newEndDate.setDate(newStartDate.getDate() + 1);
        }
        break;
      default:
        return;
    }

    // ローカル状態のみ更新（過去日付制限なし）
    setLocalTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === dragState.taskId 
          ? { ...t, start_date: dateToString(newStartDate), end_date: dateToString(newEndDate) }
          : t
      )
    );
  }, [dragState, localTasks, dateRange]);

  // ドラッグ終了（DB更新）
  const handleMouseUp = useCallback(async () => {
    if (dragState.isDragging && dragState.taskId && onTaskUpdate) {
      const localTask = localTasks.find(t => t.id === dragState.taskId);
      if (localTask) {
        try {
          // DB更新を実行
          onTaskUpdate(dragState.taskId, {
            start_date: localTask.start_date,
            end_date: localTask.end_date,
          });
        } catch (error) {
          console.error('Failed to update task:', error);
          // エラー時は元の状態に復元
          setLocalTasks(prevTasks => 
            prevTasks.map(t => 
              t.id === dragState.taskId 
                ? { ...t, start_date: dragState.originalStartDate, end_date: dragState.originalEndDate }
                : t
            )
          );
        }
      }
    }
    
    setDragState({
      isDragging: false,
      taskId: null,
      dragType: null,
      startX: 0,
      originalStartDate: '',
      originalEndDate: '',
    });
  }, [dragState, localTasks, onTaskUpdate]);

  // イベントリスナーの設定
  useMemo(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="gantt-chart overflow-auto" data-testid="gantt-chart">
      {/* ヘッダー（日付） */}
      <div className="gantt-header bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
        <div className="flex min-w-max">
          <div className="w-64 p-2 border-r border-gray-300 bg-white">
            <span className="font-semibold">タスク</span>
          </div>
          <div className="flex flex-1">
            {dates.map((date, index) => (
              <div
                key={index}
                className={`flex-1 min-w-[60px] p-2 text-xs text-center border-r border-gray-200 ${
                  isWeekend(date) ? 'bg-red-50' : 'bg-white'
                }`}
              >
                <div className="font-medium">{formatDate(date)}</div>
                {viewMode === 'day' && (
                  <div className={`text-xs ${isWeekend(date) ? 'text-red-600' : 'text-gray-500'}`}>
                    {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ガントチャート本体 */}
      <div className="gantt-body">
        {projects.map(project => {
          const projectTasks = tasks.filter(task => task.project_id === project.id);
          
          return (
            <div key={project.id} className="project-group mb-4">
              {/* プロジェクト行 */}
              <div className="flex min-w-max bg-blue-50 border-b border-gray-200">
                <div className="w-64 p-3 border-r border-gray-300 bg-blue-100">
                  <div className="font-semibold text-blue-800">{project.name}</div>
                  <div className="text-xs text-blue-600">{project.start_date}</div>
                </div>
                <div className="flex-1 relative h-12">
                  {/* グリッド線 */}
                  <div className="absolute inset-0 flex">
                    {dates.map((date, index) => (
                      <div
                        key={index}
                        className={`flex-1 min-w-[60px] border-r border-gray-200 ${
                          isWeekend(date) ? 'bg-red-25' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* タスク行 */}
              {projectTasks.map(task => (
                <div key={task.id} className="flex min-w-max hover:bg-gray-50">
                  <div className="w-64 p-2 border-r border-gray-300 bg-white">
                    <div className="text-sm font-medium">{task.name}</div>
                    <div className="text-xs text-gray-500">
                      {task.start_date} 〜 {task.end_date}
                    </div>
                  </div>
                  <div className="flex-1 relative h-10">
                    {/* グリッド線 */}
                    <div className="absolute inset-0 flex">
                      {dates.map((date, index) => (
                        <div
                          key={index}
                          className={`flex-1 min-w-[60px] border-r border-gray-200 ${
                            isWeekend(date) ? 'bg-red-25' : ''
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* タスクバー */}
                    <div
                      className={`absolute top-2 h-6 bg-blue-500 rounded flex items-center text-white text-xs font-medium shadow-sm hover:bg-blue-600 cursor-pointer select-none ${
                        dragState.taskId === task.id && dragState.isDragging ? 'opacity-75' : ''
                      }`}
                      style={getTaskStyle(localTasks.find(t => t.id === task.id) || task)}
                      title={`${task.name}: ${task.start_date} - ${task.end_date}`}
                      onMouseDown={(e) => handleMouseDown(e, task, 'move')}
                    >
                      {/* 左端リサイズハンドル */}
                      <div
                        className="absolute left-0 top-0 w-2 h-full bg-blue-700 rounded-l cursor-w-resize hover:bg-blue-800"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, task, 'resize-start');
                        }}
                        title="開始日を調整"
                      />
                      
                      {/* タスク名 */}
                      <span className="truncate px-2 flex-1">{task.name}</span>
                      
                      {/* 右端リサイズハンドル */}
                      <div
                        className="absolute right-0 top-0 w-2 h-full bg-blue-700 rounded-r cursor-e-resize hover:bg-blue-800"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleMouseDown(e, task, 'resize-end');
                        }}
                        title="終了日を調整"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChart;