import { useEffect, useState } from 'react';
import { statsAPI } from '../../api';
import StatCard from '../../components/ui/StatCard';
import DonutChart from '../../components/ui/DonutChart';
import ProgressBar from '../../components/ui/ProgressBar';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { RoleBadge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Icon from '../../components/icons';
import { fmtDate, getMentionCls, getMentionFromGrade } from '../../utils/helpers';

const MENTION_COLORS = {
  'Très Bien (16-20)':  'var(--green)',
  'Bien (14-16)':       'var(--accent2)',
  'Assez Bien (12-14)': 'var(--gold)',
  'Passable (10-12)':   'var(--text2)',
  'Ajourné (<10)':      'var(--red)',
};

export default function AdminStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.global().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Chargement des statistiques..." />;
  if (!stats)  return <div className="page"><EmptyState icon="xCircle" title="Erreur de chargement des statistiques" /></div>;

  const passRate = stats.gradeStats.passed + stats.gradeStats.failed > 0
    ? Math.round(stats.gradeStats.passed / (stats.gradeStats.passed + stats.gradeStats.failed) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Statistiques Académiques</h2>
        <p>Vue d'ensemble de la plateforme — Année 2025-2026</p>
      </div>

      <div className="stats-grid">
        <StatCard     value={stats.totals.students}        label="Étudiants"        animClass="fade-up-1" />
        <StatCard     value={stats.totals.teachers}        label="Enseignants"      animClass="fade-up-2" />
        <StatCard     value={stats.totals.programs}        label="Filières"         animClass="fade-up-3" />
        <StatCard     value={`${stats.gradeStats.avg}/20`} label="Moyenne globale"  animClass="fade-up-4" />
        <StatCard     value={`${passRate}%`}               label="Taux de réussite" animClass="fade-up-5" />
        <StatCard     value={stats.gradeStats.failed}      label="Échecs"           animClass="fade-up-5" />
      </div>

      <div className="grid-2" style={{ marginBottom:18 }}>
        <div className="card fade-up">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
               Répartition des Mentions
            </span>
          </div>
          <div className="card-body">
            {stats.gradeDistribution.map((d, i) => {
              const total = stats.gradeDistribution.reduce((s, x) => s + parseInt(x.count), 0);
              const pct   = total ? Math.round(parseInt(d.count) / total * 100) : 0;
              const color = MENTION_COLORS[d.range] || 'var(--accent)';
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, fontWeight:600, color }}>{d.range}</span>
                    <span style={{ fontSize:12, color:'var(--text3)' }}>{d.count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} color={color} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card fade-up">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
               Synthèse Visuelle
            </span>
          </div>
          <div className="card-body">
            <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
              <DonutChart value={parseFloat(stats.gradeStats.avg).toFixed(1)} max={20}
                color={parseFloat(stats.gradeStats.avg) >= 10 ? 'var(--green)' : 'var(--red)'}
                size={130} label="Moy. /20" />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>TAUX DE RÉUSSITE</div>
                <div style={{ fontSize:26, fontWeight:800, color:'var(--green)' }}>{passRate}%</div>
                <ProgressBar value={passRate} color="var(--green)" />
                <div style={{ display:'flex', gap:20, marginTop:14 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Validés</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--green)' }}>{stats.gradeStats.passed}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Échoués</div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--red)' }}>{stats.gradeStats.failed}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card fade-up">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
               Performance par Module
            </span>
          </div>
          <div style={{ padding:0 }}>
            {stats.moduleStats.map((m, i) => {
              const avg = parseFloat(m.avg_grade || 0);
              const mention = getMentionFromGrade(avg);
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 20px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.module_name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{m.student_count} étudiants</div>
                  </div>
                  {m.avg_grade
                    ? <span className={`grade-badge ${getMentionCls(mention)}`}>{avg.toFixed(1)}/20</span>
                    : <span style={{ color:'var(--text3)', fontSize:12 }}>N/A</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card fade-up">
          <div className="card-header">
            <span className="card-title" style={{ display:'flex', alignItems:'center', gap:7 }}>
               Derniers Inscrits
            </span>
          </div>
          <div style={{ padding:0 }}>
            {stats.recentUsers.map((u) => (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:'1px solid var(--border)' }}>
                <Avatar firstName={u.first_name} lastName={u.last_name} size="sm" />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{u.email}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <RoleBadge role={u.role} />
                  <span style={{ fontSize:10, color:'var(--text3)' }}>{fmtDate(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
