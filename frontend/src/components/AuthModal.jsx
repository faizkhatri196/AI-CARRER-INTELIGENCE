import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import { X, Sparkles, AlertCircle, Loader2, UserCheck, Briefcase } from 'lucide-react';

export default function AuthModal({ isOpen, initialMode = 'login', initialRole = 'candidate', onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanName = (name || '').trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const payload = {
          name: cleanName || 'User',
          email: cleanEmail,
          password: cleanPassword,
          role,
          organization: (organization || '').trim() || (role === 'recruiter' ? 'Acme Corp' : 'Personal')
        };
        const res = await axios.post(getApiUrl('/api/auth/register'), payload, { timeout: 45000 });
        onSuccess(res.data);
      } else {
        const payload = { email: cleanEmail, password: cleanPassword };
        const res = await axios.post(getApiUrl('/api/auth/login'), payload, { timeout: 45000 });
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message === 'Network Error') {
        setError('Cloud server is waking up or network is slow. Please retry in a moment, or click Quick Demo Access below.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please verify your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (demoRole) => {
    const demoUser = {
      user_id: `demo_${demoRole}_${Date.now().toString(36)}`,
      name: demoRole === 'recruiter' ? 'Lead Recruiter (Demo)' : 'Alex Mercer (Demo)',
      email: demoRole === 'recruiter' ? 'recruiter@demo.ai' : 'candidate@demo.ai',
      role: demoRole,
      organization: demoRole === 'recruiter' ? 'Global Talent Tech' : 'Independent',
      token: 'demo_session_token_career_intelligence_2026'
    };
    onSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0f172a] border border-gray-800 rounded-3xl shadow-2xl p-5 sm:p-7 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pr-8">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base sm:text-lg text-white">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Primary Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                      role === 'candidate'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Candidate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                      role === 'recruiter'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Recruiter</span>
                  </button>
                </div>
              </div>

              {role === 'recruiter' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Acme Recruiting"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isRegister ? 'Complete Registration' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold py-1 px-1.5"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold py-1 px-1.5"
              >
                Create one now
              </button>
            </span>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-800">
          <p className="text-center text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-2.5">
            Or Instant Demo Exploration
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoAccess('candidate')}
              className="py-2 px-2.5 rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Candidate Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccess('recruiter')}
              className="py-2 px-2.5 rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-all text-center flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recruiter Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
