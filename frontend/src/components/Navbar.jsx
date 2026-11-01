import React from 'react';
import { 
  Briefcase, UserCheck, Sparkles, LogOut, ShieldCheck, 
  Layers, Sliders, BarChart3, FileText, ChevronRight
} from 'lucide-react';

export default function Navbar({ user, mode, onModeChange, onLogout, onOpenAuth }) {
  return (
    <header className="border-b border-gray-800/80 bg-[#0c1222]/90 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onModeChange && onModeChange('candidate')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  CAREER<span className="text-blue-500">.AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  v2.0 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium hidden sm:block">
                AI Talent Discovery & Explainable Career Intelligence
              </p>
            </div>
          </div>

          {/* Dual Experience Switcher */}
          {user && (
            <div className="flex items-center bg-gray-900/90 border border-gray-800 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => onModeChange('candidate')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'candidate'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Candidate Intelligence</span>
              </button>

              <button
                onClick={() => onModeChange('recruiter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'recruiter'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Recruiter Screening</span>
                <span className="bg-indigo-400/20 text-indigo-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  Multi-Resume
                </span>
              </button>
            </div>
          )}

          {/* Right Action / Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-200">{user.name}</span>
                  <span className="text-[10px] text-gray-400 capitalize">{user.role || 'Member'} • {user.organization || 'Workspace'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-500/20 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
