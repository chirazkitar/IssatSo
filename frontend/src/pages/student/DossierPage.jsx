import { useEffect, useState } from 'react';
import { gradesAPI } from '../../api';
import { fmtDate, fmtNum, weightedAvg, getMentionCls, getMentionFromGrade } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { MentionBadge, Chip } from '../../components/ui/Badge';

export default function DossierPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradesAPI
      .dossier()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Chargement du dossier..." />;
  if (!data)   return (
    <div className="page">
      <EmptyState icon="❌" title="Impossible de charger le dossier" />
    </div>
  );

  const { profile, grades } = data;
  const sems    = [...new Set(grades.map((g) => g.semester))].sort();
  const graded  = grades.filter((g) => g.final_grade);
  const globalAvg     = weightedAvg(graded);
  const globalMention = getMentionFromGrade(globalAvg) || '—';

  const personalInfo = [
    ['Nom & Prénom',       `${profile.first_name} ${profile.last_name}`],
    ['N° Étudiant',        profile.student_number],
    ['Email',              profile.email],
    ['Date de naissance',  fmtDate(profile.date_of_birth)],
    ['Lieu de naissance',  profile.place_of_birth],
    ['Adresse',            profile.address],
  ];

  const academicInfo = [
    ['Filière',              profile.program_name],
    ['Niveau',               profile.level],
    ['Département',          profile.department_name],
    ["Année d'inscription",  profile.enrollment_year],
    ['Bac - Année',          profile.bac_year],
    ['Bac - Mention',        profile.bac_mention],
    ['Modules notés',        graded.length],
    ['Modules validés',      graded.filter((g) => parseFloat(g.final_grade) >= 10).length],
  ];

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Dossier Académique</h2>
        <p>Récapitulatif complet — toutes les années</p>
      </div>

      {/* Info cards */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        {/* Personal */}
        <div className="card fade-up-1">
          <div className="card-header">
            <span className="card-title">👤 Informations Personnelles</span>
          </div>
          <div className="card-body">
            {personalInfo.filter(([, v]) => v).map(([l, v]) => (
              <div
                key={l}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic */}
        <div className="card fade-up-2">
          <div className="card-header">
            <span className="card-title">🎓 Parcours Académique</span>
          </div>
          <div className="card-body">
            {academicInfo.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([l, v]) => (
              <div
                key={l}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div
              style={{
                marginTop: 16, padding: 14,
                background: 'var(--bg3)', borderRadius: 'var(--radius2)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>MOYENNE GÉNÉRALE</div>
              <div
                style={{
                  fontSize: 28, fontWeight: 800,
                  color: parseFloat(globalAvg) >= 10 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {globalAvg ?? '—'}/20
              </div>
              <div style={{ marginTop: 6 }}>
                <MentionBadge mention={globalMention !== '—' ? globalMention : null} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester tables */}
      {sems.map((sem) => {
        const sg  = grades.filter((g) => g.semester === sem);
        const avg = weightedAvg(sg.filter((g) => g.final_grade));

        return (
          <div key={sem} className="card fade-up" style={{ marginBottom: 16 }}>
            <div className="sem-header">
              <h4>📘 Semestre {sem}</h4>
              {avg && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Moy. pond. :</span>}
              {avg && <span className="sem-avg">{avg}/20</span>}
              <Chip>{sg.length} modules</Chip>
            </div>

            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  <th>Module</th>
                  <th>Coeff</th>
                  <th>Crédits</th>
                  <th>DS</th>
                  <th>Examen</th>
                  <th>Finale</th>
                  <th>Mention</th>
                  <th>Enseignant</th>
                </tr>
              </thead>
              <tbody>
                {sg.map((g) => (
                  <tr key={g.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{g.module_name}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{g.coefficient}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{g.credit_hours || '—'}</td>
                    <td style={{ fontSize: 13 }}>{g.ds_grade ?? '—'}</td>
                    <td style={{ fontSize: 13 }}>{g.exam_grade ?? '—'}</td>
                    <td
                      style={{
                        fontWeight: 700, fontSize: 13,
                        color: parseFloat(g.final_grade) >= 10 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {fmtNum(g.final_grade)}
                    </td>
                    <td><MentionBadge mention={g.mention} /></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{g.teacher_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
