import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ImportNotes from './pages/ImportNotes';
import StudyWorkspace from './pages/StudyWorkspace';
import Results from './pages/Results';
import Progress from './pages/Progress';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(api.getCurrentUser());
  const [currentTab, setCurrentTab] = useState(user ? 'dashboard' : 'landing');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [lastQuizResult, setLastQuizResult] = useState(null);
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    const handleAuthChange = () => {
      const u = api.getCurrentUser();
      setUser(u);
      if (!u) setCurrentTab('landing');
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Quick 1-Click Demo
  const handleQuickDemo = async () => {
    try {
      const res = await api.guestLogin();
      setUser(res.user);
      setCurrentTab('import');
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentTab('landing');
  };

  const handleStudyKitGenerated = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentTab('workspace');
  };

  const handleOpenSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentTab('workspace');
  };

  /**
   * Start Session from a Next Best Action.
   * The backend has already generated the study kit from the topic's notes, so
   * this is the same handoff Import Notes uses — the student lands in the
   * existing Study Workspace.
   */
  const handleStartRecommendedSession = (sessionId) => {
    if (!sessionId) return;
    setActiveSessionId(sessionId);
    setCurrentTab('workspace');
  };

  const handleQuizCompleted = (results, session) => {
    setLastQuizResult(results);
    setLastSession(session);
    setCurrentTab('results');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setTab={(tab) => {
          if (!user && (tab === 'dashboard' || tab === 'import' || tab === 'progress')) {
            setCurrentTab('login');
          } else {
            setCurrentTab(tab);
          }
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <Landing
            onStartLearning={() => setCurrentTab('register')}
            onQuickDemo={handleQuickDemo}
          />
        )}

        {currentTab === 'login' && (
          <Login
            onLoginSuccess={(u) => {
              setUser(u);
              setCurrentTab('dashboard');
            }}
            onSwitchToRegister={() => setCurrentTab('register')}
            onGuestDemo={handleQuickDemo}
          />
        )}

        {currentTab === 'register' && (
          <Register
            onRegisterSuccess={(u) => {
              setUser(u);
              setCurrentTab('dashboard');
            }}
            onSwitchToLogin={() => setCurrentTab('login')}
            onGuestDemo={handleQuickDemo}
          />
        )}

        {currentTab === 'dashboard' && user && (
          <Dashboard
            user={user}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSession={handleOpenSession}
            onStartSession={handleStartRecommendedSession}
          />
        )}

        {currentTab === 'import' && user && (
          <ImportNotes
            onStudyKitGenerated={handleStudyKitGenerated}
          />
        )}

        {currentTab === 'workspace' && user && (
          <StudyWorkspace
            sessionId={activeSessionId}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onQuizCompleted={handleQuizCompleted}
          />
        )}

        {currentTab === 'results' && user && lastQuizResult && (
          <Results
            quizResult={lastQuizResult}
            session={lastSession}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onOpenRevisionSession={(sessionId) => {
              setActiveSessionId(sessionId);
              setCurrentTab('workspace');
            }}
          />
        )}

        {currentTab === 'progress' && user && (
          <Progress
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}
      </main>
    </div>
  );
}
