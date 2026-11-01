import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import CandidateDashboard from './components/Candidate/CandidateDashboard';
import RecruiterDashboard from './components/Recruiter/RecruiterDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('candidate'); // 'candidate' or 'recruiter'
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login', role: 'candidate' });

  useEffect(() => {
    // Check local storage for persistent session
    const storedUser = localStorage.getItem('careerUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        if (parsed.role === 'recruiter') {
          setMode('recruiter');
        }
      } catch (e) {
        localStorage.removeItem('careerUser');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('careerUser', JSON.stringify(userData));
    if (userData.role === 'recruiter') {
      setMode('recruiter');
    } else {
      setMode('candidate');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('careerUser');
    setMode('candidate');
  };

  const handleOpenAuth = (authMode, initialRole = 'candidate') => {
    setAuthModal({ isOpen: true, mode: authMode, role: initialRole });
  };

  const handleSelectLandingExperience = (exp) => {
    setMode(exp);
    // If not logged in, prompt sign in or guest session
    if (!user) {
      handleOpenAuth('register', exp);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-200 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      <Navbar
        user={user}
        mode={mode}
        onModeChange={(m) => setMode(m)}
        onLogout={handleLogout}
        onOpenAuth={(m) => handleOpenAuth(m, mode)}
      />

      <main className="flex-1">
        {user ? (
          mode === 'recruiter' ? (
            <RecruiterDashboard user={user} />
          ) : (
            <CandidateDashboard user={user} />
          )
        ) : (
          <LandingPage onSelectExperience={handleSelectLandingExperience} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        initialRole={authModal.role}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
