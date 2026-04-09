import { useEffect, useMemo, useState } from 'react';
import { usersAPI } from '../../api/apifetch';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fmtDate } from '../../utils/helpers';
import { RoleBadge, Chip } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/icons';

export default function UsersAdmin() {
  const { user: currentUser } = useAuth();
  const isChef = currentUser?.role === 'chef_departement';
  const toast = useToast();
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    usersAPI.list(isChef ? 'teacher' : undefined).then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, [isChef]);

  async function handleApprove(id) {
    if (!confirm('Voulez-vous approuver ce compte ?')) return;
    try {
      await usersAPI.approve(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'approved' } : u)));
      if (selectedUser?.id === id) setSelectedUser((prev) => ({ ...prev, status: 'approved' }));
      toast('Compte approuvé avec succès', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchRole   = filter === 'all' || u.role === filter;
      const matchSearch = !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    }),
    [users, filter, search]
  );

  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>{isChef ? 'Corps Enseignant' : 'Gestion des Utilisateurs'}</h2>
        <p>{users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card fade-up" style={{ marginBottom:18 }}>
        <div style={{ padding:'14px 18px', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="input-wrap" style={{ flex:1, minWidth:180 }}>
            <span className="input-icon"><Icon name="search" size={13} /></span>
            <input placeholder="Rechercher par nom, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {!isChef && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width:'auto', minWidth:160 }}>
              <option value="all">Tous les rôles</option>
              <option value="student">Étudiants</option>
              <option value="teacher">Enseignants</option>
              <option value="chef_departement">Chef Département</option>
            </select>
          )}
          <Chip>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</Chip>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="table-wrap fade-up">
          <table>
            <thead>
              <tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Identifiant</th><th>Programme / Dép.</th><th>Inscription</th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ cursor:'pointer' }} onClick={() => setSelectedUser(u)}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar firstName={u.first_name} lastName={u.last_name} size="sm" />
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{u.first_name} {u.last_name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{u.phone || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'var(--text3)', fontSize:12 }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td style={{ fontSize:12 }}>{u.status === 'pending' ? <span style={{ color: '#d97706', fontWeight: 600 }}>En attente</span> : <span style={{ color: '#16a34a' }}>Approuvé</span>}</td>
                  <td><Chip>{u.student_number || u.employee_number || '—'}</Chip></td>
                  <td style={{ fontSize:12, color:'var(--text2)' }}>{u.program_name || u.department_name || '—'}</td>
                  <td style={{ fontSize:12, color:'var(--text3)' }}>{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <Modal title="Détails Utilisateur" onClose={() => setSelectedUser(null)}
          footer={
            <div style={{ display: 'flex', gap: 10 }}>
              {selectedUser.status === 'pending' && !isChef && (
                <button className="btn btn-primary" onClick={() => handleApprove(selectedUser.id)}>Approuver le compte</button>
              )}
              <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Fermer</button>
            </div>
          }>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20 }}>
            <Avatar firstName={selectedUser.first_name} lastName={selectedUser.last_name} size="lg" />
            <div>
              <div style={{ fontSize:18, fontWeight:700 }}>{selectedUser.first_name} {selectedUser.last_name}</div>
              <div style={{ fontSize:13, color:'var(--text3)', margin:'3px 0' }}>{selectedUser.email}</div>
              <RoleBadge role={selectedUser.role} />
            </div>
          </div>
          <div className="grid-2">
            {[
              ['N° ID',       selectedUser.student_number || selectedUser.employee_number || '—'],
              ['Téléphone',   selectedUser.phone || '—'],
              ['Programme',   selectedUser.program_name || '—'],
              ['Département', selectedUser.department_name || '—'],
              ["Date d'inscription", fmtDate(selectedUser.created_at)],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:500 }}>{value}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
