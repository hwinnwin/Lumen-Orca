import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import SocialCommandCenter from './pages/ComposePage';
import QueuePage from './pages/QueuePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ConnectionManager from './components/connections/ConnectionManager';
import OAuthCallback from './pages/OAuthCallback';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import GeneratorPage from './pages/GeneratorPage';
import { useSocket } from './hooks/useSocket';
import { useUIStore } from './store/ui-store';
import { useAuthStore } from './store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInitializer>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <SocialCommandCenter />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/queue"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <QueuePage />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <AnalyticsPage />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/connections"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <ConnectionManager />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <GeneratorPage />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <SettingsPage />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ThemeInitializer>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontFamily: "'Sora', sans-serif",
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
