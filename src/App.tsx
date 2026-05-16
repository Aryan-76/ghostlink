import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell.tsx';
import LandingPage from './pages/LandingPage.tsx';
import AuthPage from './pages/AuthPage.tsx';
import MainWorkspace from './pages/MainWorkspace.tsx';
import RealtimeChat from './pages/RealtimeChat.tsx';
import AICollabWorkspace from './pages/AICollabWorkspace.tsx';
import CommandCenter from './pages/CommandCenter.tsx';
import IntelligenceSearch from './pages/IntelligenceSearch.tsx';
import SpatialThreads from './pages/SpatialThreads.tsx';
import UserProfile from './pages/UserProfile.tsx';
import MobileWorkspace from './pages/MobileWorkspace.tsx';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* App Shell Routes */}
        <Route path="/workspace" element={<Shell><MainWorkspace /></Shell>} />
        <Route path="/chat" element={<Shell><RealtimeChat /></Shell>} />
        <Route path="/ai-collab" element={<Shell><AICollabWorkspace /></Shell>} />
        <Route path="/command" element={<Shell><CommandCenter /></Shell>} />
        <Route path="/search" element={<Shell><IntelligenceSearch /></Shell>} />
        <Route path="/threads" element={<Shell><SpatialThreads /></Shell>} />
        <Route path="/profile" element={<Shell><UserProfile /></Shell>} />
        
        {/* Specialized Views */}
        <Route path="/mobile" element={<MobileWorkspace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
