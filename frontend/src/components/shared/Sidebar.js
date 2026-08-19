import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

const Sidebar = ({ links, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} min-h-screen bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col transition-all duration-300 flex-shrink-0 relative z-20`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <div className="text-white font-black text-lg tracking-tight">NagarSeva</div>
            <div className="text-primary-400 text-xs font-semibold uppercase tracking-wider">{subtitle}</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 border border-white/10">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-white font-bold truncate tracking-wide">{user?.name}</div>
              <div className="text-gray-400 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path ||
            (link.path !== '/' && location.pathname.startsWith(link.path));
          
          const Icon = link.icon;
          
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-gradient-to-r from-primary-600/20 to-transparent text-white border-l-2 border-primary-500 rounded-l-none' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title={collapsed ? link.label : ''}
            >
              <div className={`${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
              </div>
              {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">{link.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-red-400 hover:text-red-300 hover:bg-red-500/10 group">
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span className="font-semibold text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
