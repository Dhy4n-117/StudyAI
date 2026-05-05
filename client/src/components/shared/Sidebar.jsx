import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard',   desc: 'My Documents' },
  { path: '/chat',      icon: '💬', label: 'Ask AI',      desc: 'Chat & Q&A' },
  { path: '/quiz',      icon: '🧠', label: 'Quiz',         desc: 'Test yourself' },
  { path: '/flashcards',icon: '🃏', label: 'Flashcards',   desc: 'Spaced recall' },
  { path: '/summary',   icon: '📖', label: 'Summaries',    desc: 'Key topics' },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeDocName = localStorage.getItem('activeDocumentName');

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">S</div>
          {!isCollapsed && (
            <div className="sidebar-logo-info">
              <div className="sidebar-logo-name">StudyAI</div>
              <div className="sidebar-logo-sub">your learning companion</div>
            </div>
          )}
        </div>
      </div>

      <button 
        className={`sidebar-toggle ${isCollapsed ? 'is-collapsed' : ''}`} 
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {!isCollapsed && activeDocName && (
        <div className="sidebar-active-doc">
          <span className="sidebar-active-label">CURRENT DOCUMENT</span>
          <div className="sidebar-active-name" title={activeDocName}>
            <span>📄</span> {activeDocName}
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
            style={{ '--index': index }}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {!isCollapsed && (
              <div className="sidebar-link-text">
                <span className="sidebar-link-label">{item.label}</span>
                <span className="sidebar-link-desc">{item.desc}</span>
              </div>
            )}
            {location.pathname.startsWith(item.path) && !isCollapsed && (
              <span className="sidebar-link-dot" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && !isCollapsed && (
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <button onClick={logout} className="btn-logout">
              <span>🚪</span> Logout
            </button>
          </div>
        )}
        
        {isCollapsed && user && (
          <button onClick={logout} className="sidebar-link btn-logout-icon" title="Logout">
            <span className="sidebar-link-icon">🚪</span>
          </button>
        )}

        <div className="sidebar-footer-badge">
          <span className="sidebar-footer-dot" />
          {!isCollapsed && <span>AI Online</span>}
        </div>
      </div>
    </aside>
  );
}
