import { useEffect, useState } from 'react';
import { usersAPI } from '../../api';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';

const ROLE_TYPES = [
  { value: 'student',          icon: '👨‍🎓', label: 'Étudiant'         },
  { value: 'teacher',          icon: '👨‍🏫', label: 'Enseignant'        },
  { value: 'chef_departement', icon: '🏛️', label: 'Chef Département'   },
];

const BAC_MENTIONS = ['Passable', 'Assez Bien', 'Bien', 'Très Bien'];

export default function CreateUser() {
  const toast = useToast();
  const [form,        setForm]        = useState({ role: 'student', first_name: '', last_name: '', email: '', phone: '' });
  const [programs,    setPrograms]    = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    usersAPI.programs().then(setPrograms).catch(console.error);
    usersAPI.departments().then(setDepartments).catch(console.error);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await usersAPI.create(form);
      toast('Compte créé ! Mot de passe par défaut : Password@2024', 'success', 5000);
      setForm({ role: form.role, first_name: '', last_name: '', email: '', phone: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const isStudent = form.role === 'student';
  const isTeacher = form.role === 'teacher' || form.role === 'chef_departement';

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Créer un Compte</h2>
        <p>Ajouter un nouvel utilisateur à la plateforme</p>
      </div>

      <div className="card fade-up-1">
        {/* Role type selector */}
        <div className="card-header">
          <span className="card-title">📋 Type de compte</span>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ROLE_TYPES.map(({ value, icon, label }) => (
              <button
                key={value}
                type="button"
                className={`btn ${form.role === value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => set('role', value)}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Common fields */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
              Informations générales
            </p>
            <div className="grid-2">
              <div className="form-group">
                <label>Prénom *</label>
                <input required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Prénom" />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Nom de famille" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@university.dz" />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+213 XXX XXX XXX" />
              </div>
            </div>

            {/* Student-specific fields */}
            {isStudent && (
              <>
                <hr className="divider" />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                  Informations Étudiant
                </p>
                <div className="grid-2">
                  <div className="form-group">
                    <label>N° Étudiant *</label>
                    <input required value={form.student_number || ''} onChange={(e) => set('student_number', e.target.value)} placeholder="2024/INFO/001" />
                  </div>
                  <div className="form-group">
                    <label>Filière *</label>
                    <select required value={form.program_id || ''} onChange={(e) => set('program_id', e.target.value)}>
                      <option value="">Sélectionner une filière...</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input type="date" value={form.date_of_birth || ''} onChange={(e) => set('date_of_birth', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Lieu de naissance</label>
                    <input value={form.place_of_birth || ''} onChange={(e) => set('place_of_birth', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Année d'inscription</label>
                    <input type="number" value={form.enrollment_year || ''} onChange={(e) => set('enrollment_year', e.target.value)} placeholder="2024" />
                  </div>
                  <div className="form-group">
                    <label>Année Bac</label>
                    <input type="number" value={form.bac_year || ''} onChange={(e) => set('bac_year', e.target.value)} placeholder="2023" />
                  </div>
                  <div className="form-group">
                    <label>Mention Bac</label>
                    <select value={form.bac_mention || ''} onChange={(e) => set('bac_mention', e.target.value)}>
                      <option value="">—</option>
                      {BAC_MENTIONS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adresse</label>
                    <input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {isTeacher && (
              <>
                <hr className="divider" />
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                  Informations Enseignant
                </p>
                <div className="grid-2">
                  <div className="form-group">
                    <label>N° Employé *</label>
                    <input required value={form.employee_number || ''} onChange={(e) => set('employee_number', e.target.value)} placeholder="TEACH-XXX" />
                  </div>
                  <div className="form-group">
                    <label>Département *</label>
                    <select required value={form.department_id || ''} onChange={(e) => set('department_id', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Spécialisation</label>
                    <input value={form.specialization || ''} onChange={(e) => set('specialization', e.target.value)} placeholder="Ex: Réseaux & Systèmes" />
                  </div>
                  <div className="form-group">
                    <label>Date d'embauche</label>
                    <input type="date" value={form.hire_date || ''} onChange={(e) => set('hire_date', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <hr className="divider" />
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              💡 Le mot de passe par défaut sera <strong>Password@2024</strong>. L'utilisateur pourra le modifier dans ses paramètres.
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <><Spinner size={16} /> Création en cours...</>
              ) : (
                '✨ Créer le compte'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
