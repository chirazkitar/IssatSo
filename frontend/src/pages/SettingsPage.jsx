import { useState } from 'react';

import { useAuth } from '../context/AuthContext';

import { useTheme } from '../context/ThemeContext';

import { useToast } from '../context/ToastContext';

import { fmtDate, getRoleLabel } from '../utils/helpers';

import Toggle from '../components/ui/Toggle';

import PasswordModal from '../components/ui/PasswordModal';



const LANGUAGES = [

  { value: 'fr', label: 'Français' },

  { value: 'ar', label: 'العربية'  },

  { value: 'en', label: 'English'   },

];



export default function SettingsPage() {

  const { user, logout }  = useAuth();

  const { theme, toggle } = useTheme();

  const toast             = useToast();



  const [showPwd,     setShowPwd]     = useState(false);

  const [notifEmail,  setNotifEmail]  = useState(true);

  const [notifGrades, setNotifGrades] = useState(true);



  function handleLangChange(val) {

    toast('Langue enregistrée', 'success');

  }



  function handleNotif(name, setter, current) {

    setter(!current);

    toast(current ? 'Notifications désactivées' : 'Notifications activées', 'info');

  }



  return (

    <div className="page">

      <div className="page-header fade-up">

        <h2>Paramètres</h2>

        <p>Gérez vos préférences de compte</p>

      </div>



      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* Appearance */}

        <div className="card fade-up-1">

          <div className="card-header">

            <span className="card-title">Apparence</span>

          </div>

          <div className="card-body">

            <div className="settings-row">

              <div className="settings-info">

                <label>Thème</label>

                <p>Choisir le thème sombre ou clair</p>

              </div>

              <Toggle

                on={theme === 'light'}

                onToggle={toggle}

                label={theme === 'dark' ? 'Sombre' : 'Clair'}

              />

            </div>



            <div className="settings-row">

              <div className="settings-info">

                <label>Langue</label>

                <p>Choisir la langue de l'interface</p>

              </div>

              <select

                defaultValue="fr"

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

            <span className="card-title">Notifications</span>

          </div>

          <div className="card-body">

            {[

              {

                label:  'Notifications par email',

                desc:   'Recevoir les notifications par email',

                state:  notifEmail,

                setter: setNotifEmail,

              },

              {

                label:  'Notifications de notes',

                desc:   'Recevoir les notifications de notes',

                state:  notifGrades,

                setter: setNotifGrades,

              },

            ].map((n) => (

              <div key={n.label} className="settings-row">

                <div className="settings-info">

                  <label>{n.label}</label>

                  <p>{n.desc}</p>

                </div>

                <Toggle

                  on={n.state}

                  onToggle={() => handleNotif(n.label, n.setter, n.state)}

                />

              </div>

            ))}

          </div>

        </div>



        {/* Security */}

        <div className="card fade-up-3">

          <div className="card-header">

            <span className="card-title">Sécurité</span>

          </div>

          <div className="card-body">

            <div className="settings-row">

              <div className="settings-info">

                <label>Changer le mot de passe</label>

                <p>Modifier votre mot de passe</p>

              </div>

              <button className="btn btn-ghost" onClick={() => setShowPwd(true)}>

                Changer

              </button>

            </div>

            <div className="settings-row">

              <div className="settings-info">

                <label>Session active</label>

                <p>Connexion: {getRoleLabel(user.role)}</p>

              </div>

              <button className="btn btn-danger" onClick={logout}>

                Déconnexion

              </button>

            </div>

          </div>

        </div>



        {/* About */}

        <div className="card fade-up-4">

          <div className="card-header">

            <span className="card-title">À propos</span>

          </div>

          <div className="card-body">

            {[

              ['Application',    'UniPlatform v2.0'],

              ['Technologie',    'React + Node.js + PostgreSQL'],

              ['Votre rôle',     getRoleLabel(user.role)],

              ['Email',          user.email],

              ['Membre depuis',  fmtDate(user.created_at)],

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

