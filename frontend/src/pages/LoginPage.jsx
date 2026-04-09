import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNTS } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/icons';

export default function LoginPage({ onGoToRegister }) {
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
      toast('Connexion réussie', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />
      <div className="login-orb orb3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <Icon name="mortarboard" size={26} />
        </div>

        <div className="login-title">
          <h1>UniPlatform</h1>
          <p>Plateforme de Gestion Académique</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icon name="exclamationTriangle" size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adresse Email</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon name="envelope" size={14} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.dz"
                required
                autoFocus
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-wrap">
              <span className="input-icon">
                <Icon name="lock" size={14} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingLeft: 36, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--text3)', cursor: 'pointer',
                  padding: '4px', display: 'flex',
                }}
              >
                <Icon name={showPass ? 'eyeSlash' : 'eye'} size={15} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <><Spinner size={16} /> Connexion...</>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)' }}>
          Pas encore de compte ?{' '}
          <button 
            type="button" 
            onClick={onGoToRegister}
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary)', 
              cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline'
            }}
          >
            S'inscrire
          </button>
        </div>

        {/* Demo accounts */}
        <div className="demo-box">
          <div className="demo-box-title">Comptes de démonstration</div>
          {DEMO_ACCOUNTS.map((d) => (
            <div
              key={d.email}
              className="demo-row"
              onClick={() => { setEmail(d.email); setPassword(d.pass); setError(''); }}
            >
              <span className="demo-role">{d.role}</span>
              <span className="demo-creds">{d.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
