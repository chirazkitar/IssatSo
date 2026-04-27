import { useEffect, useState } from 'react';
import { stagesAPI } from '../../api/index';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/ui/Avatar';
import Icon from '../../components/icons';
import Loader from '../../components/ui/Loader';
import Spinner from '../../components/ui/Spinner';

// ─── SVG icons (Bootstrap Icons) ─────────────────────────────────────────────
const CheckCircleFill = ({ size = 14, color = '#16A34A' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="0 0 16 16">
    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
  </svg>
);

const XCircleFill = ({ size = 14, color = '#DC2626' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="0 0 16 16">
    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
  </svg>
);

// ─── helper : fetch-based download (sends Authorization header) ───────────────
async function downloadFile(url, filename) {
  const token = localStorage.getItem('uni_token');
  try {
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch (e) {
    console.error('Download error', e);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DiplomeAdmin() {
  const toast = useToast();
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [validating, setValidating] = useState(null);

  useEffect(() => {
    stagesAPI.allStudents()
      .then(setStudents)
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleValider(studentId) {
    setValidating(studentId);
    try {
      await stagesAPI.validerDiplome(studentId);
      toast('Diplôme validé avec succès !', 'success');
      const updated = await stagesAPI.allStudents();
      setStudents(updated);
    } catch (err) {
      toast(err.message || 'Conditions non remplies', 'error');
    } finally {
      setValidating(null);
    }
  }

  const typeLabel = { ete: 'Été', fin_etude: "Fin d'étude" };

  if (loading) return <div className="page"><Loader /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Validation des Diplômes</h2>
        <p>Vérifiez les conditions et validez les diplômes des étudiants.</p>
      </div>

      {students.length === 0 ? (
        <p style={{ color: 'var(--text3)' }}>Aucun étudiant trouvé.</p>
      ) : students.map(s => {
        const atts      = s.attestations || [];
        const hasEte    = atts.some(a => a.type === 'ete');
        const hasFin    = atts.some(a => a.type === 'fin_etude');
        const validated = s.diplome_status === 'validated';

        return (
          <div key={s.id} className="card" style={{ marginBottom: 16, padding: 20 }}>

            {/* ── Header : identité + bouton ── */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar firstName={s.first_name} lastName={s.last_name} size="md" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {s.first_name} {s.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {s.student_number} · {s.program_name}
                  </div>
                </div>
              </div>

              {validated ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: '#16A34A', fontWeight: 700, fontSize: 13,
                  background: 'rgba(22,163,74,0.1)',
                  padding: '4px 12px', borderRadius: 99,
                }}>
                  <CheckCircleFill size={14} color="#16A34A" />
                  Diplôme validé — {s.moyenne_generale}/20
                </span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleValider(s.id)}
                  disabled={validating === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {validating === s.id
                    ? <><Spinner size={12} /> Vérification…</>
                    : <><Icon name="checkCircle" size={12} /> Valider le diplôme</>
                  }
                </button>
              )}
            </div>

            {/* ── Attestations ── */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {atts.length === 0 ? (
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Aucune attestation déposée
                </span>
              ) : atts.map(att => (
                <button
                  key={att.id}
                  onClick={() => downloadFile(stagesAPI.downloadAttestation(att.id), att.filename)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                    background: att.type === 'fin_etude'
                      ? 'rgba(79,99,240,0.1)' : 'rgba(22,163,74,0.1)',
                    border: `1px solid ${att.type === 'fin_etude'
                      ? 'rgba(79,99,240,0.3)' : 'rgba(22,163,74,0.3)'}`,
                    fontSize: 12,
                    color: att.type === 'fin_etude' ? 'var(--accent2)' : '#16A34A',
                  }}
                >
                  <Icon name="paperclip" size={11} />
                  {typeLabel[att.type]} — {att.filename}
                </button>
              ))}
            </div>

            {/* ── Conditions ── */}
            {!validated && (
              <div style={{
                marginTop: 10, display: 'flex', gap: 12,
                flexWrap: 'wrap', fontSize: 12,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  color: hasEte ? '#16A34A' : '#DC2626',
                }}>
                  {hasEte
                    ? <CheckCircleFill size={13} color="#16A34A" />
                    : <XCircleFill    size={13} color="#DC2626"  />
                  }
                  Stage d'été
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  color: hasFin ? '#16A34A' : '#DC2626',
                }}>
                  {hasFin
                    ? <CheckCircleFill size={13} color="#16A34A" />
                    : <XCircleFill    size={13} color="#DC2626"  />
                  }
                  Stage de fin d'étude
                </span>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}