import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="navbar-logo">✅</span>
          <span className="navbar-title">TaskFlow</span>
        </div>
        <div className="navbar-right">
          <div className="navbar-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="btn btn-secondary navbar-logout" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
