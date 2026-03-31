import { useEffect, useState } from 'react';
import { gradesAPI } from '../../api';
import { useToast } from '../../context/ToastContext';
import { getMentionFromGrade, calcFinalGrade } from '../../utils/helpers';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { MentionBadge, Chip } from '../../components/ui/Badge';

export default function GradesEntryPage() {
  const toast = useToast();
  const [modules,     setModules]     = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [localGrades, setLocalGrades] = useState({});
  const [saving,      setSaving]      = useState({});
  const [savingAll,   setSavingAll]   = useState(false);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    gradesAPI.teacherStudents().then((data) => {
      setModules(data);
      if (data.length) setSelected(data[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function getLocal(sid, field) {
    const key = `${sid}_${field}`;
    if (localGrades[key] !== undefined) return localGrades[key];
    const st = selected?.students.find((s) => s.id === sid);
    return st?.[field === 'ds' ? 'ds_grade' : 'exam_grade'] ?? '';
  }

  function updateGrade(sid, field, val) {
    setLocalGrades((g) => ({ ...g, [`${sid}_${field}`]: val }));
  }

  async function saveOne(student) {
    const ds   = getLocal(student.id, 'ds');
    const exam = getLocal(student.id, 'exam');
    if (ds === '' && exam === '') { toast('Saisir au moins une note', 'warn'); return; }
    setSaving((s) => ({ ...s, [student.id]: true }));
    try {
      const res = await gradesAPI.saveGrade({
        student_id: student.id,
        module_id:  selected.module_id,
        ds_grade:   ds   !== '' ? ds   : null,
        exam_grade: exam !== '' ? exam : null,
      });
      toast(`${student.first_name} : ${res.final_grade}/20 — ${res.mention}`, 'success');
      // Update local module data
      setModules((mods) =>
        mods.map((m) =>
          m.module_id === selected.module_id
            ? {
                ...m,
                students: m.students.map((s) =>
                  s.id === student.id
                    ? { ...s, ds_grade: parseFloat(ds) || null, exam_grade: parseFloat(exam) || null, final_grade: parseFloat(res.final_grade), mention: res.mention }
                    : s
                ),
              }
            : m
        )
      );
      setSelected((sel) =>
        sel
          ? {
              ...sel,
              students: sel.students.map((s) =>
                s.id === student.id
                  ? { ...s, final_grade: parseFloat(res.final_grade), mention: res.mention }
                  : s
              ),
            }
          : sel
      );
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving((s) => ({ ...s, [student.id]: false }));
    }
  }

  async function saveAll() {
    if (!selected) return;
    setSavingAll(true);
    let saved = 0, errors = 0;
    for (const student of selected.students) {
      const ds   = getLocal(student.id, 'ds');
      const exam = getLocal(student.id, 'exam');
      if (ds === '' && exam === '') continue;
      try {
        await gradesAPI.saveGrade({
          student_id: student.id,
          module_id:  selected.module_id,
          ds_grade:   ds   !== '' ? ds   : null,
          exam_grade: exam !== '' ? exam : null,
        });
        saved++;
      } catch { errors++; }
    }
    toast(`${saved} note${saved !== 1 ? 's' : ''} enregistrée${saved !== 1 ? 's' : ''}${errors ? ` (${errors} erreur${errors !== 1 ? 's' : ''})` : ''}`, 'success');
    setSavingAll(false);
  }

  const filteredStudents = selected?.students.filter((s) =>
    !search || `${s.first_name} ${s.last_name} ${s.student_number}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading) return <Loader />;
  if (!modules.length) return (
    <div className="page">
      <EmptyState icon="📭" title="Aucun module assigné" sub="Contactez le chef de département" />
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div
        className="page-header fade-up"
        style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h2>Saisie des Notes</h2>
          <p>Finale = DS × 40% + Examen × 60%</p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={savingAll || !selected}>
          {savingAll ? '⏳ Sauvegarde...' : '💾 Tout enregistrer'}
        </button>
      </div>

      {/* Module selector cards */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        {modules.map((m, i) => (
          <div
            key={m.module_id}
            className={`card card-hover fade-up-${(i % 4) + 1}`}
            style={{
              cursor: 'pointer',
              border: selected?.module_id === m.module_id ? '1.5px solid var(--accent)' : '',
            }}
            onClick={() => setSelected(m)}
          >
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 26 }}>📚</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.module_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  S{m.semester} • Coeff {m.coefficient} • {m.students.length} étudiants
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Chip>{m.code}</Chip>
                  <Chip variant="chip-green">{m.students.filter((s) => parseFloat(s.final_grade) >= 10).length} validés</Chip>
                  <Chip>{m.students.filter((s) => s.final_grade !== null).length} notés</Chip>
                </div>
              </div>
              {selected?.module_id === m.module_id && (
                <span style={{ color: 'var(--accent)', fontSize: 20 }}>✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Grade table */}
      {selected && (
        <div className="card fade-up">
          <div className="card-header">
            <div>
              <span className="card-title">✏️ {selected.module_name}</span>
              <Chip style={{ marginLeft: 10 }}>{selected.students.length} étudiants</Chip>
            </div>
            <div className="search-wrap" style={{ width: 220 }}>
              <span className="search-icon">🔍</span>
              <input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: 12, padding: '7px 10px 7px 32px' }}
              />
            </div>
          </div>

          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>N° Étudiant</th>
                  <th>Nom & Prénom</th>
                  <th>DS /20</th>
                  <th>Examen /20</th>
                  <th>Finale</th>
                  <th>Mention</th>
                  <th>Enreg.</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const ds   = getLocal(s.id, 'ds');
                  const exam = getLocal(s.id, 'exam');
                  const dsN  = parseFloat(ds);
                  const exN  = parseFloat(exam);
                  const preview = !isNaN(dsN) && !isNaN(exN)
                    ? calcFinalGrade(ds, exam)
                    : s.final_grade != null
                      ? parseFloat(s.final_grade).toFixed(2)
                      : null;
                  const mentionPreview = preview != null ? getMentionFromGrade(preview) : null;

                  return (
                    <tr key={s.id}>
                      <td><Chip>{s.student_number}</Chip></td>
                      <td style={{ fontWeight: 600 }}>{s.last_name} {s.first_name}</td>
                      <td className="grade-input-cell">
                        <input
                          type="number"
                          min="0" max="20" step="0.25"
                          value={ds}
                          placeholder="DS"
                          onChange={(e) => updateGrade(s.id, 'ds', e.target.value)}
                          style={{ borderColor: !isNaN(dsN) && (dsN < 0 || dsN > 20) ? 'var(--red)' : '' }}
                        />
                      </td>
                      <td className="grade-input-cell">
                        <input
                          type="number"
                          min="0" max="20" step="0.25"
                          value={exam}
                          placeholder="Exam"
                          onChange={(e) => updateGrade(s.id, 'exam', e.target.value)}
                          style={{ borderColor: !isNaN(exN) && (exN < 0 || exN > 20) ? 'var(--red)' : '' }}
                        />
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: preview != null
                            ? parseFloat(preview) >= 10 ? 'var(--green)' : 'var(--red)'
                            : 'var(--text3)',
                        }}
                      >
                        {preview != null ? `${preview}/20` : '—'}
                      </td>
                      <td><MentionBadge mention={mentionPreview} /></td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => saveOne(s)}
                          disabled={saving[s.id]}
                        >
                          {saving[s.id] ? <Spinner size={12} /> : '💾'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
