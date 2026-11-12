import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPassword = (formData.password || '').trim();
    const cleanName = (formData.name || '').trim();

    // Strict email format validation
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister 
        ? { name: cleanName || 'User', email: cleanEmail, password: cleanPassword, role: 'candidate' }
        : { email: cleanEmail, password: cleanPassword };
      const response = await axios.post(getApiUrl(endpoint), payload, { timeout: 45000 });
      onLogin(response.data);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.message === 'Network Error') {
        setError('Cloud server is waking up or network is slow. Please retry in a few seconds.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
      <div className="glass-panel p-10 rounded-3xl max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-400">Sign in to access your career intelligence dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Sign Up' : 'Sign In')} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
