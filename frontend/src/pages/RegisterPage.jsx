import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/icons';
import { authAPI, usersAPI } from '../api/apifetch';

const ROLE_TYPES = [
  { value: 'student',          label: 'Étudiant'         },
  { value: 'teacher',          label: 'Enseignant'        },
  { value: 'chef_departement', label: 'Chef Département'   },
];
const BAC_MENTIONS = ['Passable', 'Assez Bien', 'Bien', 'Très Bien'];

export default function RegisterPage({ onGoToLogin }) {
  const { register } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    role: 'student',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersAPI.programs().then(setPrograms).catch(console.error);
    usersAPI.departments().then(setDepartments).catch(console.error);
  }, []);

  const set = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.email.trim().toLowerCase().endsWith('@university.tn')) {
      setError("L'adresse email doit obligatoirement se terminer par @university.tn");
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authAPI.register(formData);
      toast(`Inscription réussie ! Votre compte est en attente d'approbation par l'administration.`, 'success', 8000);
      onGoToLogin();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const isStudent = formData.role === 'student';
  const isTeacher = formData.role === 'teacher' || formData.role === 'chef_departement';

  return (
    <div className="login-page">
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />
      <div className="login-orb orb3" />

      <div className="login-card" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="login-logo-wrap" style={{ margin: '0 auto 12px', width: 44, height: 44 }}>
          <img src="/favicon.svg" alt="IssatSo Logo" style={{ width: 36, height: 36 }} />
        </div>
        <div className="login-title">
          <h1>Inscription</h1>
          <p>Rejoignez IssatSo Platform</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textAlign: 'center' }}>Type de compte</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ROLE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`btn ${formData.role === value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => set('role', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Informations générales
          </p>
          <div className="grid-2">
            <div className="form-group">
              <label>Prénom *</label>
              <input required value={formData.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Prénom" />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input required value={formData.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Nom de famille" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={formData.email} onChange={(e) => set('email', e.target.value)} placeholder="email@university.tn" />
            </div>
            <div className="form-group">
              <label>Mot de passe *</label>
              <input type="password" required value={formData.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input value={formData.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+216 XXX XXX XXX" />
            </div>
          </div>

          {isStudent && (
            <>
              <hr className="divider" style={{ margin: '20px 0' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Informations Étudiant
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label>N° Étudiant *</label>
                  <input required value={formData.student_number || ''} onChange={(e) => set('student_number', e.target.value)} placeholder="2026/INFO/001" />
                </div>
                <div className="form-group">
                  <label>Filière *</label>
                  <select required value={formData.program_id || ''} onChange={(e) => set('program_id', e.target.value)}>
                    <option value="">Sélectionner une filière...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date de naissance</label>
                  <input type="date" value={formData.date_of_birth || ''} onChange={(e) => set('date_of_birth', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Lieu de naissance</label>
                  <input value={formData.place_of_birth || ''} onChange={(e) => set('place_of_birth', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Année d'inscription</label>
                  <input type="number" value={formData.enrollment_year || ''} onChange={(e) => set('enrollment_year', e.target.value)} placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Année Bac</label>
                  <input type="number" value={formData.bac_year || ''} onChange={(e) => set('bac_year', e.target.value)} placeholder="2023" />
                </div>
                <div className="form-group">
                  <label>Mention Bac</label>
                  <select value={formData.bac_mention || ''} onChange={(e) => set('bac_mention', e.target.value)}>
                    <option value="">—</option>
                    {BAC_MENTIONS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input value={formData.address || ''} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {isTeacher && (
            <>
              <hr className="divider" style={{ margin: '20px 0' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Informations Enseignant
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label>N° Employé *</label>
                  <input required value={formData.employee_number || ''} onChange={(e) => set('employee_number', e.target.value)} placeholder="TEACH-XXX" />
                </div>
                <div className="form-group">
                  <label>Département *</label>
                  <select required value={formData.department_id || ''} onChange={(e) => set('department_id', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Spécialisation</label>
                  <input value={formData.specialization || ''} onChange={(e) => set('specialization', e.target.value)} placeholder="Ex: Réseaux & Systèmes" />
                </div>
                <div className="form-group">
                  <label>Date d'embauche</label>
                  <input type="date" value={formData.hire_date || ''} onChange={(e) => set('hire_date', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <><Spinner size={16} /> Inscription en cours...</>
            ) : (
              ' Créer mon compte'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)' }}>
          Déjà un compte ?{' '}
          <button 
            type="button" 
            onClick={onGoToLogin}
            style={{ 
              background: 'none', border: 'none', color: 'var(--primary)', 
              cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline'
            }}
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
