// ─── STRING HELPERS ──────────────────────────────────────────────────────────
export function getInitials(firstName = '', lastName = '') {
  return ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || '?';
}

// ─── ROLE HELPERS ─────────────────────────────────────────────────────────────
export function getRoleLabel(role) {
  const labels = {
    student:          'Étudiant',
    teacher:          'Enseignant',
    admin:            'Administrateur',
    chef_departement: 'Chef Département',
  };
  return labels[role] || role;
}

export function getRoleCls(role) {
  const classes = {
    student:          'role-student',
    teacher:          'role-teacher',
    admin:            'role-admin',
    chef_departement: 'role-chef',
  };
  return classes[role] || 'role-student';
}

// ─── GRADE HELPERS ────────────────────────────────────────────────────────────
export function getMentionCls(mention) {
  const classes = {
    'Très Bien':  'grade-tb',
    'Bien':       'grade-b',
    'Assez Bien': 'grade-ab',
    'Passable':   'grade-p',
    'Ajourné':    'grade-aj',
  };
  return classes[mention] || 'grade-p';
}

export function getMentionFromGrade(grade) {
  const g = parseFloat(grade);
  if (isNaN(g)) return null;
  if (g >= 16)  return 'Très Bien';
  if (g >= 14)  return 'Bien';
  if (g >= 12)  return 'Assez Bien';
  if (g >= 10)  return 'Passable';
  return 'Ajourné';
}

export function calcFinalGrade(ds, exam) {
  const d = parseFloat(ds);
  const e = parseFloat(exam);
  if (isNaN(d) || isNaN(e)) return null;
  return (d * 0.4 + e * 0.6).toFixed(2);
}

// ─── WEIGHTED AVERAGE ─────────────────────────────────────────────────────────
export function weightedAvg(grades) {
  const graded = grades.filter(
    (g) => g.final_grade !== null && g.final_grade !== undefined
  );
  if (!graded.length) return null;
  const tc = graded.reduce((a, g) => a + parseFloat(g.coefficient || 1), 0);
  const tw = graded.reduce(
    (a, g) => a + parseFloat(g.final_grade) * parseFloat(g.coefficient || 1), 0
  );
  return tc ? (tw / tc).toFixed(2) : null;
}

// ─── DATE / NUMBER HELPERS ────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-DZ');
}

export function fmtNum(n, def = '—') {
  return n !== null && n !== undefined ? parseFloat(n).toFixed(2) : def;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const MENTIONS = ['Très Bien', 'Bien', 'Assez Bien', 'Passable', 'Ajourné'];

export const DEMO_ACCOUNTS = [
  { role: 'Admin',      email: 'admin@university.tn',   pass: 'Admin@2024'   },
  { role: 'Chef Dép.',  email: 'chef@university.tn',    pass: 'Chef@2024'    },
  { role: 'Enseignant', email: 'teacher@university.tn', pass: 'Teacher@2024' },
  { role: 'Étudiant',   email: 'student@university.tn', pass: 'Student@2024' },
];

export const PAGE_TITLES = {
  dashboard:     'Tableau de bord',
  profile:       'Mon Profil',
  grades:        'Mes Notes',
  dossier:       'Dossier Académique',
  'grades-entry': 'Saisie des Notes',
  'users-admin':  'Utilisateurs',
  'create-user':  'Créer un Compte',
  modules:       'Affectation Modules',
  settings:      'Paramètres',
  messaging:     'Messagerie',
};

/** icon names map to Icon component keys (no emoji) */
export const NAV_ITEMS_BY_ROLE = {
  student: [
    { key: 'dashboard', icon: 'home',        label: 'Tableau de bord' },
    { key: 'profile',   icon: 'person',      label: 'Mon Profil'      },
    { key: 'grades',    icon: 'barChart',    label: 'Mes Notes'       },
    { key: 'dossier',   icon: 'folder',      label: 'Dossier Académique' },
    { key: 'messaging',  icon: 'envelope',  label: 'Messagerie'         },
      { key: 'settings',  icon: 'gear',        label: 'Paramètres'      },
  ],
  teacher: [
    { key: 'dashboard',    icon: 'home',     label: 'Tableau de bord'  },
    { key: 'profile',      icon: 'person',   label: 'Mon Profil'       },
    { key: 'grades-entry', icon: 'pencil',   label: 'Saisie des Notes' },
    { key: 'messaging',  icon: 'envelope',  label: 'Messagerie'         },
      { key: 'settings',     icon: 'gear',     label: 'Paramètres'       },
  ],
  admin: [
    { key: 'dashboard',   icon: 'graphUp',   label: 'Statistiques'     },
    { key: 'users-admin', icon: 'people',    label: 'Utilisateurs'     },
    { key: 'create-user', icon: 'plusCircle',label: 'Créer Compte'     },
    { key: 'messaging',  icon: 'envelope',  label: 'Messagerie'         },
      { key: 'settings',    icon: 'gear',      label: 'Paramètres'       },
  ],
  chef_departement: [
    { key: 'dashboard',    icon: 'home',      label: 'Tableau de bord'    },
    { key: 'profile',      icon: 'person',    label: 'Mon Profil'         },
    { key: 'grades-entry', icon: 'pencil',    label: 'Saisie des Notes'   },
    { key: 'modules',      icon: 'book',      label: 'Affectation Modules'},
    { key: 'users-admin',  icon: 'people',    label: 'Enseignants'        },
    { key: 'messaging',  icon: 'envelope',  label: 'Messagerie'         },
      { key: 'settings',     icon: 'gear',      label: 'Paramètres'         },
  ],
};
