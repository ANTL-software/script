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
    value: 'relance',
    label: 'Relance',
    description: 'Relance post vente',
    icon: '🔄',
    color: '#10b981',
  },
  {
    value: 'rdv_pris',
    label: 'Commande à établir',
    description: 'Un rappel a ete planifie',
    icon: '📅',
    color: '#3b82f6',
  },
  {
    value: 'rendez_vous_pris',
    label: 'Rendez-vous pris',
    description: 'Un rendez-vous a été pris',
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
    value: 'pas_disponible',
    label: 'Pas disponible',
    description: 'Le prospect n\'est pas disponible',
    icon: '📅',
    color: '#be185d',
  },
  {
    value: 'repondeur',
    label: 'Répondeur',
    description: 'Répondeur détecté',
    icon: '📟',
    color: '#e11d48',
  },
  {
    value: 'non_abouti',
    label: 'Non abouti',
    description: 'Barrage secrétaire',
    icon: '❌',
    color: '#dc2626',
  },
  {
    value: 'refus_definitif',
    label: 'Refus definitif',
    description: 'Le prospect n\'est pas interesse',
    icon: '🚫',
    color: '#ef4444',
  },
  {
    value: 'siege',
    label: 'Siège',
    description: 'Le prospect est au siege',
    icon: '🏢',
    color: '#64748b',
  },
  {
    value: 'faillite',
    label: 'Faillite',
    description: 'Le prospect est en faillite',
    icon: '💼',
    color: '#991b1b',
  },
  {
    value: 'pas_attribue',
    label: 'Pas attribué',
    description: 'Le prospect ne peut pas être attribué',
    icon: '🚷',
    color: '#0891b2',
  },
  {
    value: 'particulier',
    label: 'Particulier',
    description: 'BtoC - Prospect particulier',
    icon: '👤',
    color: '#8b5cf6',
  },
  {
    value: 'doublon',
    label: 'Doublon',
    description: 'Ce prospect est un doublon',
    icon: '👯',
    color: '#64748b',
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
  rendez_vous_pris: '#3b82f6',
  non_abouti: '#dc2626',
  siege: '#64748b',
  faillite: '#991b1b',
  pas_attribue: '#0891b2',
  particulier: '#8b5cf6',
  pas_disponible: '#be185d',
  fax: '#64748b',
  doublon: '#64748b',
  optout: '#ef4444',
  repondeur: '#e11d48',
  relance: '#10b981',
  amd_repondeur_auto: '#f97316',
  amd_fax_auto: '#475569',
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
  { value: 'non_honore', label: 'Non honore' },
  { value: 'annule', label: 'Annule' },
];

/**
 * Couleurs par statut de rendez-vous
 */
export const STATUT_RENDEZ_VOUS_COLORS: Record<RendezVousStatut, string> = {
  planifie: '#3b82f6',
  effectue: '#22c55e',
  reporte: '#f59e0b',
  non_honore: '#6b7280',
  annule: '#ef4444',
};
