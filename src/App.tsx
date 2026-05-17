import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/layout/Shell.tsx';
import { WorkspaceProvider } from './hooks/useWorkspace.tsx';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

// Lazy load pages for better bundle performance
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.tsx'));
const MainWorkspace = lazy(() => import('./pages/MainWorkspace.tsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.tsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.tsx'));
const DirectMessaging = lazy(() => import('./pages/DirectMessaging.tsx'));
const GlobalCommunity = lazy(() => import('./pages/GlobalCommunity.tsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#020306]">
    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
  </div>
);

import { useAuthStore } from './store/authStore.ts';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                
                {/* App Shell Routes (Protected) */}
                <Route path="/dashboard" element={<ProtectedRoute><Shell><MainWorkspace /></Shell></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Shell><DirectMessaging /></Shell></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Shell><GlobalCommunity /></Shell></ProtectedRoute>} />
                <Route path="/project/:projectId" element={<ProtectedRoute><Shell><ProjectDetail /></Shell></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Shell><UserProfile /></Shell></ProtectedRoute>} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </WorkspaceProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
