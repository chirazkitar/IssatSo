import { useEffect, useState } from 'react';
import { modulesAPI, usersAPI } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Chip } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Loader from '../../components/ui/Loader';
import Spinner from '../../components/ui/Spinner';
import Icon from '../../components/icons';

export default function ModulesPage() {
  const toast = useToast();
  const [modules,     setModules]     = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState({});
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    Promise.all([modulesAPI.list(), usersAPI.teachers()])
      .then(([mods, tchs]) => {
        setModules(mods); setTeachers(tchs);
        const init = {};
        mods.forEach((m) => { init[m.id] = m.teacher_id ? String(m.teacher_id) : ''; });
        setAssignments(init);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function assign(moduleId) {
    const teacherId = assignments[moduleId] || null;
    setSaving((s) => ({ ...s, [moduleId]: true }));
    try {
      await modulesAPI.assign({ module_id: moduleId, teacher_id: teacherId ? parseInt(teacherId) : null });
      const teacher = teachers.find((t) => t.id === parseInt(teacherId));
      setModules((mods) => mods.map((m) => m.id === moduleId
        ? { ...m, teacher_id: teacherId ? parseInt(teacherId) : null, teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : null } : m));
      toast(teacher ? `Module affecté à ${teacher.first_name} ${teacher.last_name}` : 'Affectation retirée', 'success');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving((s) => ({ ...s, [moduleId]: false })); }
  }

  const sems = [...new Set(modules.map((m) => m.semester))].sort();
  const filteredModules = search ? modules.filter((m) => `${m.name} ${m.code}`.toLowerCase().includes(search.toLowerCase())) : modules;

  if (loading) return <Loader />;

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Affectation des Modules</h2>
        <p>Assignez les modules aux enseignants pour l'année académique en cours</p>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap', alignItems:'center' }} className="fade-up-1">
        <div className="input-wrap" style={{ flex:1, minWidth:200 }}>
          <span className="input-icon"><Icon name="search" size={13} /></span>
          <input placeholder="Rechercher un module..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Chip>{modules.length} modules</Chip>
        <Chip variant="chip-green">{modules.filter((m) => m.teacher_id).length} assignés</Chip>
        <Chip variant="chip-red">{modules.filter((m) => !m.teacher_id).length} non assignés</Chip>
      </div>

      {sems.map((sem) => {
        const semMods = filteredModules.filter((m) => m.semester === sem);
        if (!semMods.length) return null;
        return (
          <div key={sem} style={{ marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }} className="fade-up">
              <Chip variant="chip-accent" style={{ padding:'6px 14px', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                <Icon name="calendar" size={12} /> Semestre {sem}
              </Chip>
              <span style={{ fontSize:12, color:'var(--text3)' }}>
                {semMods.filter((m) => m.teacher_id).length}/{semMods.length} modules assignés
              </span>
            </div>
            <div className="card fade-up">
              <div className="table-wrap" style={{ border:'none', borderRadius:0 }}>
                <table>
                  <thead>
                    <tr><th>Module</th><th>Code</th><th>Filière</th><th>Coeff</th><th>Crédits</th><th>Enseignant Actuel</th><th>Affecter à</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {semMods.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight:600 }}>{m.name}</td>
                        <td><Chip>{m.code}</Chip></td>
                        <td style={{ fontSize:12, color:'var(--text2)' }}>{m.program_name}</td>
                        <td style={{ color:'var(--text3)' }}>{m.coefficient}</td>
                        <td style={{ color:'var(--text3)' }}>{m.credit_hours}h</td>
                        <td>
                          {m.teacher_name ? (
                            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <Avatar firstName={m.teacher_name.split(' ')[0]} lastName={m.teacher_name.split(' ')[1]||''} size="sm" />
                              <span style={{ fontSize:12, fontWeight:500 }}>{m.teacher_name}</span>
                            </span>
                          ) : (
                            <Chip variant="chip-red">Non assigné</Chip>
                          )}
                        </td>
                        <td>
                          <select value={assignments[m.id]||''} onChange={(e) => setAssignments((a) => ({ ...a, [m.id]: e.target.value }))} style={{ minWidth:180, fontSize:12 }}>
                            <option value="">— Retirer l'affectation —</option>
                            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.employee_number})</option>)}
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => assign(m.id)} disabled={saving[m.id]}>
                            {saving[m.id] ? <Spinner size={12} /> : <><Icon name="check" size={12} /> Affecter</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
