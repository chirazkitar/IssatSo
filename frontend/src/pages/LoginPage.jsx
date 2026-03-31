import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNTS } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

export default function LoginPage() {
  const { login }  = useAuth();
  const toast       = useToast();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast('Connexion réussie ! Bienvenue.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.pass);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />
      <div className="login-orb orb3" />

      <div className="login-card">
        <div className="login-logo">🎓</div>
        <div className="login-title">
          <h1>UniPlatform</h1>
          <p>Plateforme de Gestion Académique</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.dz"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--text3)', cursor: 'pointer', fontSize: 15,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 6 }}
            disabled={loading}
          >
            {loading ? (
              <><Spinner size={16} /> Connexion...</>
            ) : (
              '🚀 Se connecter'
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="demo-box">
          <div className="demo-box-title">
            ⚡ Comptes de démonstration — cliquer pour remplir
          </div>
          {DEMO_ACCOUNTS.map((d) => (
            <div key={d.email} className="demo-row" onClick={() => fillDemo(d)}>
              <span className="demo-role">{d.role}</span>
              <span className="demo-creds">{d.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
