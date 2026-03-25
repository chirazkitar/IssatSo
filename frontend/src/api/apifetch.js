// ─── API BASE URL ───────────────────────────────────────────────────────────
// When using Create React App "proxy" in package.json the base can be empty,
// but we keep it explicit here so it also works without the proxy.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── TOKEN HELPERS ──────────────────────────────────────────────────────────
export const getToken  = ()  => localStorage.getItem('uni_token');
export const setToken  = (t) => t
  ? localStorage.setItem('uni_token', t)
  : localStorage.removeItem('uni_token');

// ─── GENERIC FETCH WRAPPER ──────────────────────────────────────────────────
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || 'Erreur');
  }
  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login : (email, password) => apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
  me    : ()                => apiFetch('/auth/me'),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  list          : (role)     => apiFetch(`/users${role ? `?role=${role}` : ''}`),
  create        : (data)     => apiFetch('/users', { method: 'POST', body: data }),
  updateMe      : (data)     => apiFetch('/users/me', { method: 'PUT', body: data }),
  changePassword: (body)     => apiFetch('/users/change-password', { method: 'POST', body }),
  teachers      : ()         => apiFetch('/users/teachers'),
  programs      : ()         => apiFetch('/users/programs'),
  departments   : ()         => apiFetch('/users/departments'),
};

// ─── GRADES ──────────────────────────────────────────────────────────────────
export const gradesAPI = {
  myGrades        : ()     => apiFetch('/grades/my'),
  dossier         : ()     => apiFetch('/grades/dossier'),
  teacherStudents : ()     => apiFetch('/grades/teacher/students'),
  saveGrade       : (body) => apiFetch('/grades/save', { method: 'POST', body }),
  transcriptUrl   : ()     => `${API_BASE}/grades/transcript`,
};

// ─── MODULES ─────────────────────────────────────────────────────────────────
export const modulesAPI = {
  list   : ()     => apiFetch('/modules'),
  assign : (body) => apiFetch('/modules/assign', { method: 'POST', body }),
};

// ─── STATS ───────────────────────────────────────────────────────────────────
export const statsAPI = {
  global: () => apiFetch('/stats'),
};