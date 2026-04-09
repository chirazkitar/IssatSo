import { useEffect, useState } from 'react';
import { gradesAPI, getToken } from '../../api';
import { useToast } from '../../context/ToastContext';
import { getMentionCls, fmtNum, weightedAvg } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { MentionBadge, Chip } from '../../components/ui/Badge';
import Icon from '../../components/icons';

export default function GradesPage() {
  const toast = useToast();
  const [grades,      setGrades]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [tab,         setTab]         = useState('all');

  useEffect(() => {
    gradesAPI.myGrades().then(setGrades).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function downloadTranscript() {
    setDownloading(true);
    try {
      const res = await fetch(gradesAPI.transcriptUrl(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'releve-notes.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast('Relevé téléchargé !', 'success');
    } catch (err) {
      toast('Erreur : ' + err.message, 'error');
    } finally {
      setDownloading(false);
    }
  }

  const sems      = [...new Set(grades.map((g) => g.semester))].sort();
  const shown     = tab === 'all' ? grades : grades.filter((g) => g.semester === parseInt(tab));
  const globalAvg = weightedAvg(grades.filter((g) => g.final_grade));

  const semStats = sems.map((s) => {
    const sg  = grades.filter((g) => g.semester === s && g.final_grade);
    return { sem: s, avg: weightedAvg(sg), count: sg.length };
  });

  return (
    <div className="page">
      <div className="page-header fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2>Mes Notes</h2>
          <p>Année académique 2024-2025 • Moyenne pondérée : <strong style={{ color:'var(--accent2)' }}>{globalAvg ?? '—'}/20</strong></p>
        </div>
        <button className="btn btn-primary" onClick={downloadTranscript} disabled={downloading}>
          {downloading ? <><Spinner size={14} /> Génération...</> : <><Icon name="download" size={14} /> Relevé PDF</>}
        </button>
      </div>

      {!loading && semStats.length > 0 && (
        <div className="stats-grid fade-up-1" style={{ marginBottom:20 }}>
          {semStats.map(({ sem, avg, count }) => (
            <div key={sem} className="stat-card" style={{ cursor:'pointer', '--stat-accent': parseFloat(avg) >= 10 ? 'var(--green)' : 'var(--red)' }} onClick={() => setTab(String(sem))}>
              <div className="stat-icon"><Icon name="calendar" size={16} /></div>
              <div className="stat-value" style={{ color: parseFloat(avg) >= 10 ? 'var(--green)' : 'var(--red)', fontSize:24 }}>{avg ?? '—'}</div>
              <div className="stat-label">Semestre {sem}</div>
              <div className="stat-sub">{count} module{count !== 1 ? 's' : ''} notés</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs fade-up-2">
        <div className={`tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>Tous</div>
        {sems.map((s) => (
          <div key={s} className={`tab${tab === String(s) ? ' active' : ''}`} onClick={() => setTab(String(s))}>Sem. {s}</div>
        ))}
      </div>

      {loading ? (
        <Loader text="Chargement des notes..." />
      ) : shown.length === 0 ? (
        <EmptyState icon="folder" title="Aucune note disponible" />
      ) : (
        <div className="table-wrap fade-up-3">
          <table>
            <thead>
              <tr>
                <th>Module</th><th>Code</th><th>Sem.</th><th>Coeff</th>
                <th>DS 40%</th><th>Examen 60%</th><th>Finale /20</th>
                <th>Mention</th><th>Enseignant</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id}>
                  <td style={{ fontWeight:600 }}>{g.module_name}</td>
                  <td><Chip>{g.module_code}</Chip></td>
                  <td style={{ color:'var(--text3)' }}>S{g.semester}</td>
                  <td style={{ color:'var(--text3)' }}>{g.coefficient}</td>
                  <td>{g.ds_grade ?? '—'}</td>
                  <td>{g.exam_grade ?? '—'}</td>
                  <td style={{ fontWeight:700, color: parseFloat(g.final_grade) >= 10 ? 'var(--green)' : 'var(--red)' }}>
                    {fmtNum(g.final_grade)}
                  </td>
                  <td><MentionBadge mention={g.mention} /></td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{g.teacher_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
