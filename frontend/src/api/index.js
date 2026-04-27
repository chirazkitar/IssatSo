export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken  = ()  => localStorage.getItem('uni_token');
export const setToken  = (t) => t
  ? localStorage.setItem('uni_token', t)
  : localStorage.removeItem('uni_token');

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

// ─── helper : fetch-based download with Authorization header ─────────────────
export async function downloadFile(url, filename) {
  const token = getToken();
  try {
    const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch (e) {
    console.error('Download error', e);
  }
}

export const authAPI = {
  login : (email, password) => apiFetch('/auth/login', { method: 'POST', body: { email, password } }),
  me    : ()                => apiFetch('/auth/me'),
};

export const usersAPI = {
  list          : (role)     => apiFetch(`/users${role ? `?role=${role}` : ''}`),
  create        : (data)     => apiFetch('/users', { method: 'POST', body: data }),
  updateMe      : (data)     => apiFetch('/users/me', { method: 'PUT', body: data }),
  changePassword: (body)     => apiFetch('/users/change-password', { method: 'POST', body }),
  teachers      : ()         => apiFetch('/users/teachers'),
  programs      : ()         => apiFetch('/users/programs'),
  departments   : ()         => apiFetch('/users/departments'),
};

export const gradesAPI = {
  myGrades        : ()     => apiFetch('/grades/my'),
  dossier         : ()     => apiFetch('/grades/dossier'),
  teacherStudents : ()     => apiFetch('/grades/teacher/students'),
  saveGrade       : (body) => apiFetch('/grades/save', { method: 'POST', body }),
  transcriptUrl   : ()     => `${API_BASE}/grades/transcript`,
};

export const modulesAPI = {
  list   : ()     => apiFetch('/modules'),
  assign : (body) => apiFetch('/modules/assign', { method: 'POST', body }),
};

export const statsAPI = {
  global: () => apiFetch('/stats'),
};

export const messagesAPI = {
  inbox       : ()     => apiFetch('/messages/inbox'),
  sent        : ()     => apiFetch('/messages/sent'),
  unreadCount : ()     => apiFetch('/messages/unread-count'),
  markRead    : (id)   => apiFetch(`/messages/${id}/read`, { method: 'POST' }),
<<<<<<< HEAD
  send: (formData) => {
  const token = getToken();
  return fetch(API_BASE + '/messages/send', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,        
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(err.error || 'Erreur');
    }
    return res.json();
  });
},
  attachmentUrl: (id) => `${API_BASE}/messages/attachment/${id}`,
=======
>>>>>>> chiraz
  recipients  : ()     => apiFetch('/messages/recipients'),
  send: (formData) => {
    const token = getToken();
    return fetch(API_BASE + '/messages/send', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    });
  },
  // Use downloadFile() from this module to download with auth token
  attachmentUrl: (id) => `${API_BASE}/messages/attachment/${id}`,
};

export const stagesAPI = {
  myAttestations   : ()          => apiFetch('/stages/my'),
  deleteAttestation: (id)        => apiFetch(`/stages/${id}`, { method: 'DELETE' }),
  diplomeStatus    : ()          => apiFetch('/stages/diplome/status'),
  allStudents      : ()          => apiFetch('/stages/admin/students'),
  validerDiplome   : (studentId) => apiFetch(`/stages/admin/valider/${studentId}`, { method: 'POST' }),

  // These return URLs — pass them to downloadFile(url, filename) instead of <a href>
  downloadAttestation: (id) => `${API_BASE}/stages/download/${id}`,
  diplomeDownloadUrl : ()   => `${API_BASE}/stages/diplome/download`,

  upload: (file, type) => {
    const token = getToken();
    const fd = new FormData();
    fd.append('attestation', file);
    fd.append('type', type);
    return fetch(API_BASE + '/stages/upload', {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: fd,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    });
  },
};