import { useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { usersAPI } from '../../api/apifetch';
import { useToast } from '../../context/ToastContext';

export default function PasswordModal({ onClose }) {
  const toast = useToast();
  const [form, setForm]       = useState({ current: '', newpwd: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (form.newpwd !== form.confirm) {
      toast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (form.newpwd.length < 6) {
      toast('Mot de passe trop court (min 6 caractères)', 'warn');
      return;
    }
    setLoading(true);
    try {
      await usersAPI.changePassword({
        current_password: form.current,
        new_password:     form.newpwd,
      });
      toast('Mot de passe modifié avec succès !', 'success');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    ['Mot de passe actuel', 'current'],
    ['Nouveau mot de passe', 'newpwd'],
    ['Confirmer le nouveau', 'confirm'],
  ];

  return (
    <Modal
      title="🔑 Changer le mot de passe"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? (
              <><Spinner size={14} /> Enregistrement...</>
            ) : (
              '💾 Modifier'
            )}
          </button>
        </>
      }
    >
      {fields.map(([label, key]) => (
        <div key={key} className="form-group">
          <label>{label}</label>
          <input
            type="password"
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
            placeholder="••••••••"
          />
        </div>
      ))}
    </Modal>
  );
}
