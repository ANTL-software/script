import type { StatutAppel, RendezVousStatut } from '../types';

/**
 * Options de statut d'appel avec labels et metadata
 */
export interface StatutAppelOption {
  value: StatutAppel;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const STATUT_APPEL_OPTIONS: StatutAppelOption[] = [
  {
    value: 'vente_conclue',
    label: 'Vente conclue',
    description: 'Le prospect a accepte l\'offre',
    icon: '🎉',
    color: '#22c55e',
  },
  {
    value: 'rdv_pris',
    label: 'Rendez-vous pris',
    description: 'Un rappel a ete planifie',
    icon: '📅',
    color: '#3b82f6',
  },
  {
    value: 'abouti',
    label: 'Appel abouti',
    description: 'Conversation terminee, en reflexion',
    icon: '💬',
    color: '#8b5cf6',
  },
  {
    value: 'refus_definitif',
    label: 'Refus definitif',
    description: 'Le prospect n\'est pas interesse',
    icon: '🚫',
    color: '#ef4444',
  },
  {
    value: 'pas_de_reponse',
    label: 'Pas de reponse',
    description: 'Aucune reponse au telephone',
    icon: '📵',
    color: '#f59e0b',
  },
  {
    value: 'messagerie',
    label: 'Messagerie',
    description: 'Message laisse sur repondeur',
    icon: '📧',
    color: '#6b7280',
  },
  {
    value: 'occupe',
    label: 'Occupe',
    description: 'Ligne occupee',
    icon: '📞',
    color: '#f97316',
  },
  {
    value: 'non_abouti',
    label: 'Non abouti',
    description: 'Appel non abouti (autre raison)',
    icon: '❌',
    color: '#dc2626',
  },
];

/**
 * Couleurs par statut d'appel (pour affichage simplifie)
 */
export const STATUT_APPEL_COLORS: Record<StatutAppel, string> = {
  en_cours: '#3b82f6',
  vente_conclue: '#22c55e',
  rdv_pris: '#3b82f6',
  abouti: '#8b5cf6',
  refus_definitif: '#ef4444',
  pas_de_reponse: '#f59e0b',
  messagerie: '#6b7280',
  occupe: '#f97316',
  non_abouti: '#dc2626',
};

/**
 * Options de statut de rendez-vous
 */
export interface StatutRendezVousOption {
  value: RendezVousStatut;
  label: string;
}

export const STATUT_RENDEZ_VOUS_OPTIONS: StatutRendezVousOption[] = [
  { value: 'planifie', label: 'Planifie' },
  { value: 'effectue', label: 'Effectue' },
  { value: 'reporte', label: 'Reporte' },
  { value: 'annule', label: 'Annule' },
];

/**
 * Couleurs par statut de rendez-vous
 */
export const STATUT_RENDEZ_VOUS_COLORS: Record<RendezVousStatut, string> = {
  planifie: '#3b82f6',
  effectue: '#22c55e',
  reporte: '#f59e0b',
  annule: '#ef4444',
};
