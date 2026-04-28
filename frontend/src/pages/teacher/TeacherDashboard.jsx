import { useEffect, useState } from 'react';

import { gradesAPI } from '../../api';

import StatCard from '../../components/ui/StatCard';

import Loader from '../../components/ui/Loader';

import EmptyState from '../../components/ui/EmptyState';

import ProgressBar from '../../components/ui/ProgressBar';

import { Chip } from '../../components/ui/Badge';

import { getRoleLabel } from '../../utils/helpers';



export default function TeacherDashboard({ user, setPage }) {

  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    gradesAPI

      .teacherStudents()

      .then(setModules)

      .catch(console.error)

      .finally(() => setLoading(false));

  }, []);



  const totalStudents = modules.reduce((s, m) => s + m.students.length, 0);

  const totalGraded   = modules.reduce((s, m) => s + m.students.filter((st) => st.final_grade !== null).length, 0);

  const totalPassed   = modules.reduce((s, m) => s + m.students.filter((st) => parseFloat(st.final_grade) >= 10).length, 0);



  return (

    <div className="page">

      <div className="page-header fade-up">

        <h2>

          {user.role === 'chef_departement' ? 'Chef ' : ''}

          {user.first_name} {user.last_name} 

        </h2>

        <p>{getRoleLabel(user.role)} — Tableau de bord</p>

      </div>



      {/* KPI row */}

      <div className="stats-grid">

        <StatCard  value={modules.length}   label="Modules"    animClass="fade-up-1" />

        <StatCard  value={totalStudents}   label="Étudiants"       animClass="fade-up-2" />

        <StatCard  value={totalPassed}      label="Validés"    animClass="fade-up-3" />

        <StatCard


          value={`${totalGraded}/${totalStudents}`}

          label="Notes"


          animClass="fade-up-4"

        />

      </div>



      {/* Module cards */}

      {loading ? (

        <Loader />

      ) : modules.length === 0 ? (

        <EmptyState

          icon="📭"

          title="Aucun module"

          sub="Contactez le chef de département"

        />

      ) : (

        <div className="grid-2">

          {modules.map((m, i) => {

            const graded = m.students.filter((s) => s.final_grade !== null);

            const passed = m.students.filter((s) => parseFloat(s.final_grade) >= 10);

            const avg    = graded.length

              ? (graded.reduce((s, st) => s + parseFloat(st.final_grade), 0) / graded.length).toFixed(1)

              : null;

            const pct = m.students.length

              ? Math.round((graded.length / m.students.length) * 100)

              : 0;



            return (

              <div

                key={m.module_id}

                className={`card card-hover fade-up-${(i % 4) + 1}`}

                style={{ cursor: 'pointer' }}

                onClick={() => setPage('grades-entry')}

              >

                <div className="card-header">

                  <span className="card-title">{m.module_name}</span>

                  <Chip>{m.code}</Chip>

                </div>

                <div className="card-body">

                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>

                    {[

                      { l: 'Étudiants', v: m.students.length, c: 'var(--accent2)' },

                      { l: 'Notés',     v: graded.length,     c: 'var(--gold)'    },

                      { l: 'Validés',   v: passed.length,     c: 'var(--green)'   },

                      { l: 'Moyenne',      v: avg ?? '—',        c: 'var(--teal)'    },

                    ].map(({ l, v, c }) => (

                      <div key={l}>

                        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{l}</div>

                        <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>

                      </div>

                    ))}

                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>

                    Progression des notes — {pct}%

                  </div>

                  <ProgressBar value={pct} />

                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>

                    Sem. {m.semester} • Coeff {m.coefficient}

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}

