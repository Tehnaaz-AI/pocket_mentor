import React from 'react';
import { Sparkles, Flame, BookOpen, BarChart3, PlusCircle, LogOut, Brain, Layers } from 'lucide-react';

export default function Navbar({ currentTab, setTab, user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setTab('dashboard')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                Pocket Mentor
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 rounded border border-brand-500/30">
                AI Coach
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Turn notes into active revision kits</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setTab('import')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all ${
                currentTab === 'import'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Study Kit</span>
            </button>

            <button
              onClick={() => setTab('progress')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all ${
                currentTab === 'progress'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Mastery Progress</span>
            </button>
          </nav>
        )}

        {/* User Stats & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Streak Badge */}
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold tracking-wide">
                <Flame className="w-4 h-4 fill-amber-400 animate-pulse text-amber-400" />
                <span>{user.streak || 1} Day Streak</span>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTab('login')}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => setTab('register')}
                className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/25 transition-all"
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
