import { useAuth } from '../context/AuthContext';

// Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import GradesPage       from '../pages/student/GradesPage';
import DossierPage      from '../pages/student/DossierPage';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import GradesEntryPage  from '../pages/teacher/GradesEntryPage';
import AdminStats       from '../pages/admin/AdminStats';
import UsersAdmin       from '../pages/admin/UsersAdmin';
import CreateUser       from '../pages/admin/CreateUser';
import ModulesPage      from '../pages/chef/ModulesPage';
import ProfilePage      from '../pages/ProfilePage';
import SettingsPage     from '../pages/SettingsPage';

// Fallback
function NotFound() {
  return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-icon">🚧</div>
        <div className="empty-title">Page en cours de développement</div>
        <div className="empty-sub">Cette section sera bientôt disponible.</div>
      </div>
    </div>
  );
}

/**
 * Renders the correct page component based on `page` key and user role.
 * Shared pages (profile, settings) are always available.
 * Role-specific pages fall back to NotFound if the role doesn't match.
 */
export default function AppRouter({ page, setPage }) {
  const { user } = useAuth();
  const role = user?.role;

  // ── Shared pages (all roles) ──────────────────────────────────────────
  if (page === 'profile')  return <ProfilePage />;
  if (page === 'settings') return <SettingsPage />;

  // ── Dashboard (role-specific) ─────────────────────────────────────────
  if (page === 'dashboard') {
    if (role === 'student')          return <StudentDashboard user={user} setPage={setPage} />;
    if (role === 'admin')            return <AdminStats />;
    if (role === 'teacher' || role === 'chef_departement')
                                     return <TeacherDashboard user={user} setPage={setPage} />;
  }

  // ── Student pages ─────────────────────────────────────────────────────
  if (page === 'grades'  && role === 'student') return <GradesPage />;
  if (page === 'dossier' && role === 'student') return <DossierPage />;

  // ── Teacher / Chef pages ──────────────────────────────────────────────
  if (page === 'grades-entry' && (role === 'teacher' || role === 'chef_departement'))
    return <GradesEntryPage />;

  // ── Chef Département pages ────────────────────────────────────────────
  if (page === 'modules' && role === 'chef_departement')
    return <ModulesPage />;

  // ── Admin pages ───────────────────────────────────────────────────────
  if (page === 'users-admin' && (role === 'admin' || role === 'chef_departement'))
    return <UsersAdmin />;
  if (page === 'create-user' && role === 'admin')
    return <CreateUser />;

  return <NotFound />;
}
