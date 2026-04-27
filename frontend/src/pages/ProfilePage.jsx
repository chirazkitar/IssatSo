import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersAPI } from '../api';
import { stagesAPI } from '../api/index';
import { fmtDate, getRoleLabel } from '../utils/helpers';
import Avatar from '../components/ui/Avatar';
import { RoleBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import PasswordModal from '../components/ui/PasswordModal';
import Icon from '../components/icons';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const TYPE_LABEL = { ete: "Stage d'été", fin_etude: "Stage de fin d'étude" };

// ─── helper : fetch-based download (sends Authorization header) ───────────────
async function downloadFile(url, filename) {
  const token = localStorage.getItem('uni_token');
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob  = await res.blob();
    const href  = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = href;
    a.download  = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch (e) {
    console.error('Download error', e);
  }
}

function StageSection() {
  const toast = useToast();
  const inputRef = useRef();

  const [attestations, setAttestations] = useState([]);
  const [uploading,    setUploading]    = useState(false);
  const [selectedType, setSelectedType] = useState('ete');
  const [diplome,      setDiplome]      = useState(null);

  useEffect(() => {
    stagesAPI.myAttestations().then(setAttestations).catch(() => {});
    stagesAPI.diplomeStatus().then(setDiplome).catch(() => {});
  }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await stagesAPI.upload(file, selectedType);
      toast('Attestation ajoutée !', 'success');
      const updated = await stagesAPI.myAttestations();
      setAttestations(updated);
    } catch (err) {
      toast(err.message || 'Erreur upload', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(id) {
    try {
      await stagesAPI.deleteAttestation(id);
      setAttestations(a => a.filter(x => x.id !== id));
      toast('Supprimée', 'success');
    } catch {
      toast('Erreur suppression', 'error');
    }
  }

  return (
    <div className="card fade-up" style={{ marginTop: 20, padding: '40px 22px 22px' }}>
      <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
        Attestations de stage
      </h3>

      {/* Upload */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="input"
          style={{ width: 220 }}
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="ete">Stage d'été</option>
          <option value="fin_etude">Stage de fin d'étude</option>
        </select>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => inputRef.current.click()}
          disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {uploading
            ? <><Spinner size={12} /> Envoi…</>
            : <><Icon name="paperclip" size={12} /> Ajouter une attestation PDF</>
          }
        </button>
      </div>

      {/* Liste des attestations */}
      {attestations.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>
          Aucune attestation ajoutée.
        </p>
      ) : attestations.map(att => (
        <div key={att.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 8, marginBottom: 6,
          background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <Icon name="paperclip" size={13}
            style={{ color: 'var(--accent2)', flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {att.filename}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {TYPE_LABEL[att.type]} · {fmtSize(att.size_bytes)} ·{' '}
              {new Date(att.uploaded_at).toLocaleDateString('fr-DZ')}
            </div>
          </div>

          {/* Download via fetch — not <a href> — to send the auth token */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => downloadFile(stagesAPI.downloadAttestation(att.id), att.filename)}
          >
            <Icon name="download" size={12} />
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleDelete(att.id)}
            style={{ color: 'var(--red, #ef4444)' }}
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}

      {/* Diplôme validé */}
      {diplome && (
        <div style={{
          marginTop: 20, padding: '14px 16px', borderRadius: 10,
          background: 'rgba(22,163,74,0.08)',
          border: '1px solid rgba(22,163,74,0.3)',
        }}>
          <div style={{
            fontWeight: 700, color: '#16A34A', marginBottom: 6, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#16A34A" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            Diplôme validé
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            Moyenne générale : <strong>{diplome.moyenne_generale}/20</strong> ·{' '}
            Validé le {new Date(diplome.validated_at).toLocaleDateString('fr-DZ')}
          </div>
          {/* Download diplome via fetch */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => downloadFile(stagesAPI.diplomeDownloadUrl(), `diplome.pdf`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="download" size={12} /> Télécharger mon diplôme PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast                = useToast();

  const [editing,      setEditing]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);

  const [form, setForm] = useState({
    first_name:     user.first_name,
    last_name:      user.last_name,
    phone:          user.phone                     || '',
    date_of_birth:  user.date_of_birth?.split('T')[0] || '',
    place_of_birth: user.place_of_birth            || '',
    address:        user.address                   || '',
  });

  const isStudent = user.role === 'student';
  const isTeacher = user.role === 'teacher' || user.role === 'chef_departement';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

      {/* ── Carte profil principale ── */}
      <div className="card fade-up">
        <div className="profile-banner">
          <div className="profile-avatar-wrap">
            <Avatar firstName={user.first_name} lastName={user.last_name} size="xl" />
          </div>
        </div>

        <div className="profile-body">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
          }}>
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
                <Icon name="lock" size={14} /> Changer MDP
              </button>
              <button className="btn btn-ghost" onClick={() => setEditing(s => !s)}>
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
                {[
                  ['Prénom',    'first_name', 'text'],
                  ['Nom',       'last_name',  'text'],
                  ['Téléphone', 'phone',      'tel' ],
                ].map(([label, key, type]) => (
                  <div key={key} className="form-group">
                    <label>{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={label}
                    />
                  </div>
                ))}

                {isStudent && (
                  <>
                    <div className="form-group">
                      <label>Date de naissance</label>
                      <input
                        type="date"
                        value={form.date_of_birth}
                        onChange={e => set('date_of_birth', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Lieu de naissance</label>
                      <input
                        value={form.place_of_birth}
                        onChange={e => set('place_of_birth', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label>Adresse</label>
                      <input
                        value={form.address}
                        onChange={e => set('address', e.target.value)}
                      />
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
                  <div style={{
                    fontSize: 10, color: 'var(--text3)',
                    textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section attestations (étudiants uniquement) ── */}
      {isStudent && <StageSection />}

      {/* ── Modal changement mot de passe ── */}
      {showPwdModal && <PasswordModal onClose={() => setShowPwdModal(false)} />}
    </div>
  );
}