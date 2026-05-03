import React from 'react';
import './TaskCard.css';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done', done: 'todo' };

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  return (
    <div className="task-card card">
      <div className="task-card-top">
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        <div className="task-card-actions">
          <button className="task-action-btn" onClick={onEdit} title="Edit">✏️</button>
          <button className="task-action-btn task-action-delete" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>

      <h3 className="task-title">{task.title}</h3>
      <div style={{ marginBottom: '8px' }}>
        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
          {task.category || 'General'}
        </span>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {task.due_date && (
        <div className={`task-due ${isOverdue ? 'task-due-overdue' : ''}`}>
          📅 {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.due_date)}
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          <span>☑️</span>
          <span>{task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length} subtasks</span>
        </div>
      )}

      <div className="task-card-footer">
        <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
        <button
          className="task-advance-btn"
          onClick={() => onStatusChange(NEXT_STATUS[task.status])}
          title={`Move to ${STATUS_LABELS[NEXT_STATUS[task.status]]}`}
        >
          {task.status === 'done' ? '↩ Reset' : '→ Advance'}
        </button>
      </div>
    </div>
  );
}
