import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import StatsBar from '../components/StatsBar';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || '';

const COLUMN_META = {
  todo: {
    label: 'To Do',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.07)',
    dot: '#6366f1',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="#6366f1" strokeWidth="2" />
        <path d="M8 12h8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  in_progress: {
    label: 'In Progress',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    dot: '#f59e0b',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  done: {
    label: 'Done',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    dot: '#10b981',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="#10b981" strokeWidth="2" />
        <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ todo: 0, in_progress: 0, done: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    sort: 'created_at',
    order: 'DESC'
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Filters:", filters);

      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/tasks`, {
          params: {
            status: filters.status || 'all',
            priority: filters.priority || 'all',
            category: filters.category || 'all',
            sort: filters.sort,
            order: filters.order
          }
        }),
        axios.get(`${API}/api/tasks/stats`)
      ]);

      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
      setError('');
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Failed to load tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!user || !user.userId) return;
    const socket = io(API || 'http://localhost:3002');
    socket.on('connect', () => { socket.emit('join_user_room', user.userId); });
    socket.on('task_updated', () => { fetchTasks(); });
    return () => socket.disconnect();
  }, [user, fetchTasks]);

  const handleCreate = () => { setEditTask(null); setShowModal(true); };
  const handleEdit = (task) => { setEditTask(task); setShowModal(true); };
  const handleModalClose = () => { setShowModal(false); setEditTask(null); };

  const handleSave = async (data) => {
    try {
      if (editTask) {
        await axios.put(`${API}/api/tasks/${editTask.id}`, data);
      } else {
        await axios.post(`${API}/api/tasks`, data);
      }
      await fetchTasks();
      handleModalClose();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API}/api/tasks/${id}`);
      await fetchTasks();
    } catch {
      setError('Failed to delete task.');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await axios.put(`${API}/api/tasks/${task.id}`, { ...task, status: newStatus });
      await fetchTasks();
    } catch {
      setError('Failed to update task status.');
    }
  };

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-main">

        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="header-greeting">
            <span className="greeting-emoji">👋</span>
            <div>
              <h2 className="dashboard-title">Welcome back, {firstName}</h2>
              <p className="dashboard-subtitle">Here's your task overview for today</p>
            </div>
          </div>
          <button className="btn-new-task" onClick={handleCreate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            New Task
          </button>
        </div>

        {/* ── Stats ── */}
        <StatsBar stats={stats} />

        {/* ── Filters ── */}
        <div className="filters-bar">
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Priority</label>
            <select
              className="filter-select"
              value={filters.priority}
              onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group filter-group--grow">
            <label className="filter-label">Category</label>
            <div className="filter-search-wrap">
              <svg className="filter-search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="filter-input"
                placeholder="Filter by category..."
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              />
            </div>
          </div>

          <div className="filter-divider" />

          <div className="filter-group">
            <label className="filter-label">Sort by</label>
            <select
              className="filter-select"
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            >
              <option value="created_at">Date Created</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Order</label>
            <select
              className="filter-select"
              value={filters.order}
              onChange={e => setFilters(f => ({ ...f, order: e.target.value }))}
            >
              <option value="DESC">Newest first</option>
              <option value="ASC">Oldest first</option>
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="alert-error">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Board ── */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading your tasks…</span>
          </div>
        ) : (
          <div className="kanban-board">
            {['todo', 'in_progress', 'done'].map(key => {
              const meta = COLUMN_META[key];
              return (
                <div key={key} className="kanban-column" style={{ '--col-accent': meta.accent, '--col-bg': meta.bg }}>
                  <div className="kanban-column-header">
                    <div className="col-title-group">
                      {meta.icon}
                      <h3 className="col-title">{meta.label}</h3>
                    </div>
                    <span className="col-badge">{grouped[key].length}</span>
                  </div>

                  <div className="kanban-cards">
                    {grouped[key].length === 0 ? (
                      <div className="empty-col">
                        <span>No tasks here</span>
                      </div>
                    ) : (
                      grouped[key].map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={() => handleEdit(task)}
                          onDelete={() => handleDelete(task.id)}
                          onStatusChange={(s) => handleStatusChange(task, s)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}