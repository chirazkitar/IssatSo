import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { fmtDate, getRoleLabel } from '../utils/helpers';
import Toggle from '../components/ui/Toggle';
import PasswordModal from '../components/ui/PasswordModal';
import Icon from '../components/icons';

const LANGUAGES = [
  { value: 'fr', label: 'Français (DZ)' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export default function SettingsPage() {
  const { user, logout }  = useAuth();
  const { theme, toggle } = useTheme();
  const toast             = useToast();

  const [showPwd,     setShowPwd]     = useState(false);
  const [notifEmail,  setNotifEmail]  = useState(true);
  const [notifGrades, setNotifGrades] = useState(true);
  const [lang,        setLang]        = useState('fr');

  function handleLangChange(val) {
    setLang(val);
    toast('Langue sauvegardée', 'success');
  }

  function handleNotif(setter, current, name) {
    setter(!current);
    toast(`${name} ${!current ? 'activées' : 'désactivées'}`, 'info');
  }

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Paramètres</h2>
        <p>Personnalisez votre expérience IssatSo Platform</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Appearance */}
        <div className="card fade-up-1">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="sun" size={15} style={{ color: 'var(--gold)' }} />
              Apparence
            </span>
          </div>
          <div className="card-body">
            <div className="settings-row">
              <div className="settings-info">
                <label>Thème de l'interface</label>
                <p>Basculer entre le mode sombre et clair</p>
              </div>
              <Toggle
                on={theme === 'light'}
                onToggle={toggle}
                label={theme === 'dark' ? 'Sombre' : 'Clair'}
              />
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <label>Langue de l'interface</label>
                <p>Choisissez votre langue préférée</p>
              </div>
              <select
                value={lang}
                onChange={(e) => handleLangChange(e.target.value)}
                style={{ width: 'auto', minWidth: 130 }}
              >
                {LANGUAGES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card fade-up-2">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="bell" size={15} style={{ color: 'var(--accent2)' }} />
              Notifications
            </span>
          </div>
          <div className="card-body">
            {[
              { label: 'Notifications par email', desc: 'Recevoir les mises à jour sur votre email', state: notifEmail, setter: setNotifEmail, name: 'Notifications email' },
              { label: 'Alertes de nouvelles notes', desc: 'Être notifié quand vos notes sont publiées', state: notifGrades, setter: setNotifGrades, name: 'Alertes notes' },
            ].map((n) => (
              <div key={n.label} className="settings-row">
                <div className="settings-info">
                  <label>{n.label}</label>
                  <p>{n.desc}</p>
                </div>
                <Toggle
                  on={n.state}
                  onToggle={() => handleNotif(n.setter, n.state, n.name)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card fade-up-3">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="lockFill" size={15} style={{ color: 'var(--red)' }} />
              Sécurité
            </span>
          </div>
          <div className="card-body">
            <div className="settings-row">
              <div className="settings-info">
                <label>Mot de passe</label>
                <p>Modifier votre mot de passe de connexion</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowPwd(true)}>
                <Icon name="lock" size={14} /> Modifier
              </button>
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <label>Session active</label>
                <p>Connecté en tant que {getRoleLabel(user.role)}</p>
              </div>
              <button className="btn btn-danger" onClick={logout}>
                <Icon name="boxArrowRight" size={14} /> Déconnecter
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card fade-up-4">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="info" size={15} style={{ color: 'var(--teal)' }} />
              À propos
            </span>
          </div>
          <div className="card-body">
            {[
              ['Application',   'IssatSo Platform v2.0'],
              ['Technologie',   'React · Node.js · PostgreSQL'],
              ['Votre rôle',    getRoleLabel(user.role)],
              ['Email',         user.email],
              ['Membre depuis', fmtDate(user.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="settings-row">
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text3)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} />}
    </div>
  );
}
