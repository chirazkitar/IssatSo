import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/ui/Spinner';
import { usersAPI } from '../api/apifetch';

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
    first_name: '', last_name: '', email: '', password: '', phone: '', cin: '',
    student_number: '', program_id: '', date_of_birth: '', place_of_birth: '',
    enrollment_year: '', bac_year: '', bac_mention: '', address: '', speciality: '',
    employee_number: '', department_id: '', specialization: '', hire_date: ''
  });
  
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersAPI.programs().then(setPrograms).catch(console.error);
    usersAPI.departments().then(setDepartments).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const set = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (formData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }
      
      await register(formData);
      toast('Inscription réussie ! Bienvenue.', 'success');
    } catch (err) {
      setError(err.message);
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
        <div className="login-logo">🎓</div>
        <div className="login-title">
          <h1>Inscription</h1>
          <p>Rejoignez UniPlatform</p>
        </div>

        {error && <div className="alert alert-error">️ {error}</div>}

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
              <input required name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Prénom" />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input required name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Nom de famille" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required name="email" value={formData.email} onChange={handleChange} placeholder="votre@email.dz" />
            </div>
            <div className="form-group">
              <label>Mot de passe *</label>
              <input type="password" required name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+213 XXX XXX XXX" />
            </div>
            <div className="form-group">
              <label>CIN</label>
              <input name="cin" value={formData.cin} onChange={handleChange} placeholder="Numéro CIN" />
            </div>
          </div>

          {isStudent && (
            <>
              <hr className="divider" style={{ margin: '1.5rem 0' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Informations Étudiant
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label>N° Étudiant (Optionnel)</label>
                  <input name="student_number" value={formData.student_number} onChange={handleChange} placeholder="Auto-généré si vide" />
                </div>
                <div className="form-group">
                  <label>Filière</label>
                  <select name="program_id" value={formData.program_id} onChange={handleChange}>
                    <option value="">Sélectionner une filière...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Spécialité</label>
                  <input name="speciality" value={formData.speciality} onChange={handleChange} placeholder="Spécialité" />
                </div>
                <div className="form-group">
                  <label>Date de naissance</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Lieu de naissance</label>
                  <input name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Année d'inscription</label>
                  <input type="number" name="enrollment_year" value={formData.enrollment_year} onChange={handleChange} placeholder="2024" />
                </div>
                <div className="form-group">
                  <label>Année Bac</label>
                  <input type="number" name="bac_year" value={formData.bac_year} onChange={handleChange} placeholder="2023" />
                </div>
                <div className="form-group">
                  <label>Mention Bac</label>
                  <select name="bac_mention" value={formData.bac_mention} onChange={handleChange}>
                    <option value="">—</option>
                    {BAC_MENTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input name="address" value={formData.address} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          {isTeacher && (
            <>
              <hr className="divider" style={{ margin: '1.5rem 0' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                Informations Enseignant
              </p>
              <div className="grid-2">
                <div className="form-group">
                  <label>N° Employé (Optionnel)</label>
                  <input name="employee_number" value={formData.employee_number} onChange={handleChange} placeholder="Auto-généré si vide" />
                </div>
                <div className="form-group">
                  <label>Département</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange}>
                    <option value="">Sélectionner...</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Spécialisation</label>
                  <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Ex: Réseaux" />
                </div>
                <div className="form-group">
                  <label>Date d'embauche</label>
                  <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} />
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
              <><Spinner size={16} /> Création du compte...</>
            ) : (
              ' S\'inscrire'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text2)' }}>
          Vous avez déjà un compte ?{' '}
          <button 
            type="button" 
            onClick={onGoToLogin}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
