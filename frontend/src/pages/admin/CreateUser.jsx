import { useEffect, useState } from 'react';
import { usersAPI } from '../../api/apifetch';
import { useToast } from '../../context/ToastContext';
import Spinner from '../../components/ui/Spinner';

const ROLE_TYPES = [
  { value: 'student',          label: 'Étudiant'         },
  { value: 'teacher',          label: 'Enseignant'        },
  { value: 'chef_departement', label: 'Chef Département'   },
];

const BAC_MENTIONS = ['Passable', 'Assez Bien', 'Bien', 'Très Bien'];

export default function CreateUser() {
  return (
    <div className="page">
      <div className="page-header fade-up">
        <h2>Créer un Compte</h2>
        <p>Ajouter un nouvel utilisateur à la plateforme</p>
      </div>

      <div className="alert alert-info">
        Les nouveaux utilisateurs doivent s'inscrire via le <strong>Portail d'Inscription public</strong>.
        Vous pouvez examiner et approuver leurs comptes depuis l'onglet <strong>Gestion des Utilisateurs</strong>.
      </div>
    </div>
  );
}
