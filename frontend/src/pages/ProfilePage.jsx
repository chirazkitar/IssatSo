import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersAPI } from '../api';
import { fmtDate, getRoleLabel } from '../utils/helpers';
import Avatar from '../components/ui/Avatar';
import { RoleBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PasswordModal from '../components/ui/PasswordModal';
import Icon from '../components/icons';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast                = useToast();

  const [editing,      setEditing]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  const [form, setForm] = useState({
    first_name:     user.first_name,
    last_name:      user.last_name,
    phone:          user.phone          || '',
    date_of_birth:  user.date_of_birth?.split('T')[0] || '',
    place_of_birth: user.place_of_birth || '',
    address:        user.address        || '',
  });

  const isStudent = user.role === 'student';
  const isTeacher = user.role === 'teacher' || user.role === 'chef_departement';

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setLoading(true);
    try {
      await usersAPI.updateMe(form);
      toast('Profil mis à jour avec succès', 'success');
      updateUser(form);
      setEditing(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const studentInfo = [
    ['N° Étudiant',          user.student_number],
    ['Filière',              user.program_name],
    ["Année d'inscription",  user.enrollment_year],
    ['Bac — Année',          user.bac_year],
    ['Bac — Mention',        user.bac_mention],
    ['Date de naissance',    fmtDate(user.date_of_birth)],
    ['Lieu de naissance',    user.place_of_birth],
    ['Adresse',              user.address],
  ];

  const teacherInfo = [
    ['N° Employé',      user.employee_number],
    ['Spécialisation',  user.specialization],
    ['Département',     user.department_name],
    ["Date d'embauche", fmtDate(user.hire_date)],
  ];

  const infoFields = isStudent ? studentInfo : isTeacher ? teacherInfo : [];

  return (
    <div className="page">
      <div className="card fade-up">
        {/* Banner */}
        <div className="profile-banner">
          <div className="profile-avatar-wrap">
            <Avatar firstName={user.first_name} lastName={user.last_name} size="xl" />
          </div>
        </div>

        {/* Body */}
        <div className="profile-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="profile-name">{user.first_name} {user.last_name}</div>
              <div className="profile-meta">
                {user.email && (
                  <span className="profile-meta-item">
                    <Icon name="envelope" size={13} />
                    {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="profile-meta-item">
                    <Icon name="phone" size={13} />
                    {user.phone}
                  </span>
                )}
                <RoleBadge role={user.role} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowPwdModal(true)}>
                <Icon name="lock" size={14} />
                Changer MDP
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing((s) => !s)}>
                {editing
                  ? <><Icon name="x" size={14} /> Annuler</>
                  : <><Icon name="pencil" size={14} /> Modifier</>
                }
              </button>
            </div>
          </div>

          <hr className="divider" />

          {editing ? (
            <div>
              <div className="grid-2">
                {[['Prénom', 'first_name', 'text'], ['Nom', 'last_name', 'text'], ['Téléphone', 'phone', 'tel']].map(
                  ([label, key, type]) => (
                    <div key={key} className="form-group">
                      <label>{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={label}
                      />
                    </div>
                  )
                )}
                {isStudent && (
                  <>
                    <div className="form-group">
                      <label>Date de naissance</label>
                      <input type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Lieu de naissance</label>
                      <input value={form.place_of_birth} onChange={(e) => set('place_of_birth', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label>Adresse</label>
                      <input value={form.address} onChange={(e) => set('address', e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading
                    ? <><Spinner size={14} /> Enregistrement...</>
                    : <><Icon name="save" size={14} /> Enregistrer</>
                  }
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {infoFields.filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} />}
    </div>
  );
}
