import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('careerUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('careerUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('careerUser');
  };

  return (
    <div className="min-h-screen bg-background text-gray-200">
      <nav className="border-b border-gray-800 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                AI
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Career Intelligence
              </span>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-300">Welcome, {user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        {user ? <Dashboard user={user} /> : <Login onLogin={handleLogin} />}
      </main>
    </div>
  );
}

export default App;
