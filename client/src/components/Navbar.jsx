import React from 'react';
import { BookOpen, BarChart3, Home, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ currentTab, setTab, user, onLogout }) {
  const isStudyTab = currentTab === 'import' || currentTab === 'workspace';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-[#e0e2e8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo with Signature Yellow Dot */}
        <div 
          onClick={() => setTab(user ? 'dashboard' : 'landing')} 
          className="flex items-center space-x-2.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center text-white font-bold text-sm tracking-tight group-hover:scale-105 transition-transform">
            PM
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-base tracking-tight text-[#1c1c1e]">
              Pocket Mentor
            </span>
            <span className="w-2 h-2 rounded-full bg-[#ffd02f] inline-block shadow-sm"></span>
          </div>
        </div>

        {/* Primary Navigation — Home, Study, Progress */}
        {user && (
          <nav className="flex items-center space-x-1 bg-[#f7f8fa] p-1 rounded-full border border-[#e0e2e8]">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#1c1c1e] text-white shadow-subtle'
                  : 'text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setTab('import')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isStudyTab
                  ? 'bg-[#1c1c1e] text-white shadow-subtle'
                  : 'text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study</span>
            </button>

            <button
              onClick={() => setTab('progress')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                currentTab === 'progress'
                  ? 'bg-[#1c1c1e] text-white shadow-subtle'
                  : 'text-[#555a6a] hover:text-[#1c1c1e] hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Progress</span>
            </button>
          </nav>
        )}

        {/* User Stats & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Guest / User Badge */}
              {user.isGuest ? (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fff8e0] text-[#746019] border border-[#ffd02f]/40">
                  Guest Demo
                </span>
              ) : (
                <span className="hidden sm:inline-block text-xs font-medium text-[#555a6a]">
                  {user.name || user.email}
                </span>
              )}

              {/* User Avatar Circle */}
              <div 
                title={user.name || user.email}
                className="w-8 h-8 rounded-full bg-[#f7f8fa] border border-[#c7cad5] flex items-center justify-center text-xs font-bold text-[#1c1c1e]"
              >
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-[#8e91a0] hover:text-[#1c1c1e] hover:bg-[#f7f8fa] rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTab('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#555a6a] hover:text-[#1c1c1e] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
