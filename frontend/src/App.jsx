import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MessagingProvider } from './context/MessagingContext';
import AppShell  from './components/layout/AppShell';
import AppRouter from './router/AppRouter';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Loader    from './components/ui/Loader';

function InnerApp() {
  const { user, loading, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [authView, setAuthView] = useState('login');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader text="Vérification de la session..." />
      </div>
    );
  }
  if (!user) {
    if (authView === 'login') {
      return <LoginPage onGoToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
  }
  return (
    <MessagingProvider>
      <AppShell user={user} page={page} setPage={setPage} onLogout={logout}>
        <AppRouter page={page} setPage={setPage} />
      </AppShell>
    </MessagingProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
