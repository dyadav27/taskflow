import React from 'react';
import './StatsBar.css';

export default function StatsBar({ stats }) {
  const items = [
    { label: 'Total Tasks', value: stats.total, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'To Do', value: stats.todo, color: '#6b7280', bg: '#f3f4f6' },
    { label: 'In Progress', value: stats.in_progress, color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Completed', value: stats.done, color: '#10b981', bg: '#d1fae5' },
  ];

  return (
    <div className="stats-bar">
      {items.map(item => (
        <div className="stat-card card" key={item.label} style={{ borderTop: `3px solid ${item.color}` }}>
          <div className="stat-value" style={{ color: item.color }}>{item.value ?? 0}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
