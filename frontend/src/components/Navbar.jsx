import React, { useState } from 'react';
import { 
  Briefcase, UserCheck, Sparkles, LogOut, ShieldCheck, 
  Layers, Menu, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ user, mode, onModeChange, onLogout, onOpenAuth }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileModeSelect = (newMode) => {
    onModeChange && onModeChange(newMode);
    setMobileMenuOpen(false);
  };

  const handleMobileAuth = (authMode) => {
    setMobileMenuOpen(false);
    onOpenAuth && onOpenAuth(authMode);
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    onLogout && onLogout();
  };

  return (
    <header className="border-b border-gray-800/80 bg-[#0c1222]/95 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" 
            onClick={() => onModeChange && onModeChange('candidate')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  CAREER<span className="text-blue-500">.AI</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 sm:px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium hidden md:block">
                AI Talent Discovery & Explainable Career Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Dual Experience Switcher */}
          {user && (
            <div className="hidden md:flex items-center bg-gray-900/90 border border-gray-800 p-1 rounded-xl shadow-inner">
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

          {/* Desktop Right Action / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-200">{user.name}</span>
                  <span className="text-[10px] text-gray-400 capitalize">{user.role || 'Member'} • {user.organization || 'Workspace'}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                mode === 'recruiter' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {mode === 'recruiter' ? 'Recruiter' : 'Candidate'}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-300 hover:text-white bg-gray-900 border border-gray-800 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-800 bg-[#0b101e] px-4 pt-3 pb-5 space-y-4 shadow-2xl overflow-hidden"
          >
            {user ? (
              <div className="space-y-4">
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white uppercase shadow-sm flex-shrink-0">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-white block truncate">{user.name}</span>
                    <span className="text-xs text-gray-400 capitalize block truncate">
                      {user.role || 'Member'} • {user.organization || 'Workspace'}
                    </span>
                  </div>
                </div>

                {/* Mode Selector for Mobile */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Switch Workspace Experience:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleMobileModeSelect('candidate')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        mode === 'candidate'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-gray-900 text-gray-300 border-gray-800'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Candidate</span>
                    </button>

                    <button
                      onClick={() => handleMobileModeSelect('recruiter')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        mode === 'recruiter'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-gray-900 text-gray-300 border-gray-800'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Recruiter</span>
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleMobileLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-xs min-h-[44px] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Platform</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleMobileAuth('login')}
                  className="w-full py-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-200 font-semibold text-xs min-h-[44px] flex items-center justify-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleMobileAuth('register')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 min-h-[44px] flex items-center justify-center"
                >
                  Get Started Free
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
