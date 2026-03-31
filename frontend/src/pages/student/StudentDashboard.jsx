import { useEffect, useState } from 'react';
import { gradesAPI } from '../../api';
import BarChart from '../../components/ui/BarChart';
import DonutChart from '../../components/ui/DonutChart';
import StatCard from '../../components/ui/StatCard';
import { MentionBadge } from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { MENTIONS, getMentionCls, fmtNum, weightedAvg } from '../../utils/helpers';

export default function StudentDashboard({ user, setPage }) {
  const [grades,  setGrades]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradesAPI
      .myGrades()
      .then(setGrades)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const graded  = grades.filter((g) => g.final_grade !== null);
  const avg     = weightedAvg(graded);
  const passed  = graded.filter((g) => parseFloat(g.final_grade) >= 10).length;
  const failed  = graded.filter((g) => parseFloat(g.final_grade) <  10).length;

  const mentionDist = MENTIONS.map((m) => ({
    label: m,
    value: graded.filter((g) => g.mention === m).length,
  }));

  const passRate = graded.length
    ? Math.round((passed / graded.length) * 100)
    : 0;

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Bonjour, {user.first_name} 👋</h2>
        <p>Bienvenue sur votre espace académique — Année 2024-2025</p>
      </div>

      {/* KPI row */}
      <div className="stats-grid">
        <StatCard glyph="📊" value={avg ?? '—'} label="Moyenne Générale"  color="var(--accent2)" animClass="fade-up-1" />
        <StatCard glyph="✅" value={passed}      label="Modules Validés"   color="var(--green)"   animClass="fade-up-2" />
        <StatCard glyph="❌" value={failed}      label="À Rattraper"        color="var(--red)"     animClass="fade-up-3" />
        <StatCard glyph="📚" value={grades.length} label="Total Modules"   color="var(--gold)"    animClass="fade-up-4" />
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        {/* Donut + quick stats */}
        <div className="card fade-up-2">
          <div className="card-header">
            <span className="card-title">📈 Performance Globale</span>
          </div>
          <div className="card-body">
            <div className="ring-container">
              <DonutChart
                value={avg}
                max={20}
                color={parseFloat(avg) >= 10 ? 'var(--green)' : 'var(--red)'}
                size={130}
                label="/20"
              />
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Taux de réussite', value: `${passRate}%`,               color: 'var(--green)'   },
                  { label: 'Modules notés',    value: `${graded.length}/${grades.length}`, color: 'var(--accent2)' },
                  { label: 'Filière',          value: user.program_name || '—',      color: 'var(--gold)'    },
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent grades list */}
        <div className="card fade-up-3">
          <div className="card-header">
            <span className="card-title">📋 Dernières Notes</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('grades')}>
              Voir tout
            </button>
          </div>
          <div style={{ padding: 0 }}>
            {loading ? (
              <Loader />
            ) : graded.length === 0 ? (
              <EmptyState icon="📭" title="Aucune note" />
            ) : (
              graded.slice(0, 5).map((g) => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.module_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                      Semestre {g.semester} • Coeff {g.coefficient}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`grade-badge ${getMentionCls(g.mention)}`}>
                      {fmtNum(g.final_grade)}/20
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                      {g.mention}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mention distribution bar chart */}
      <div className="card fade-up-4">
        <div className="card-header">
          <span className="card-title">🏅 Répartition des Mentions</span>
        </div>
        <div className="card-body">
          <BarChart data={mentionDist} height={140} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {MENTIONS.map((m) => {
              const count = graded.filter((g) => g.mention === m).length;
              return (
                <MentionBadge key={m} mention={count > 0 ? m : null}>
                  <span className={`grade-badge ${getMentionCls(m)}`}>
                    {m}: {count}
                  </span>
                </MentionBadge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
