import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskModal.css';

const API = process.env.REACT_APP_API_URL || '';

export default function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium', category: 'General', due_date: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category || 'General',
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
      });
      setSubtasks(task.subtasks || []);
    } else {
      setSubtasks([]);
    }
  }, [task]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({ ...form, due_date: form.due_date || null });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    try {
      const res = await axios.post(`${API}/api/tasks/${task.id}/subtasks`, { title: newSubtask }, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubtasks([...subtasks, res.data.subtask]);
      setNewSubtask('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subId, is_completed) => {
    try {
      const res = await axios.put(`${API}/api/tasks/${task.id}/subtasks/${subId}`, { is_completed: !is_completed }, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubtasks(subtasks.map(s => s.id === subId ? res.data.subtask : s));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subId) => {
    try {
      await axios.delete(`${API}/api/tasks/${task.id}/subtasks/${subId}`, { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubtasks(subtasks.filter(s => s.id !== subId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h3 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" placeholder="What needs to be done?"
              value={form.title} onChange={handleChange} required maxLength={200} />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input modal-textarea" name="description" placeholder="Add details (optional)"
              value={form.description} onChange={handleChange} rows={3} />
          </div>

          <div className="modal-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select className="form-input" name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="modal-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category</label>
              <input className="form-input" name="category" placeholder="e.g. Work, Personal"
                value={form.category} onChange={handleChange} maxLength={50} />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" name="due_date"
                value={form.due_date} onChange={handleChange} />
            </div>
          </div>

          {task && (
            <div className="form-group subtasks-section" style={{ marginTop: '16px' }}>
              <label className="form-label">Subtasks</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subtasks.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <input type="checkbox" checked={sub.is_completed} onChange={() => handleToggleSubtask(sub.id, sub.is_completed)} style={{ width: '16px', height: '16px' }} />
                    <span style={{ flex: 1, color: sub.is_completed ? 'var(--gray-500)' : 'var(--text-main)', textDecoration: sub.is_completed ? 'line-through' : 'none' }}>
                      {sub.title}
                    </span>
                    <button type="button" onClick={() => handleDeleteSubtask(sub.id)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input className="form-input" placeholder="Add a new subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} />
                <button type="button" className="btn btn-secondary" onClick={handleAddSubtask}>Add</button>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" />{task ? 'Saving...' : 'Creating...'}</> : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
