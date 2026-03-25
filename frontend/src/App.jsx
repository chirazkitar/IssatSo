import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell  from './components/layout/AppShell';
import AppRouter from './router/AppRouter';
import LoginPage from './pages/LoginPage';
import Loader    from './components/ui/Loader';
import { ThemeProvider } from './context/ThemeContext';

function InnerApp() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState('dashboard');


  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader text="Vérification de la session..." />
      </div>
    );
  }

  
  if (!user) return <LoginPage />;


  return (
    <AppShell
      user={user}
      page={page}
      setPage={setPage}
      onLogout={logout}
    >
      <AppRouter page={page} setPage={setPage} />
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
