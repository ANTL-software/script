/**
 * Formate une duree en secondes en format MM:SS
 * @param seconds - Duree en secondes
 * @returns Chaine formatee (ex: "5:30")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate une duree en secondes en format lisible
 * @param seconds - Duree en secondes
 * @returns Chaine formatee (ex: "5 min 30 sec")
 */
export function formatDurationLong(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${secs} sec`;
}

/**
 * Formate une date en format francais long
 * @param dateString - Date au format ISO
 * @returns Date formatee (ex: "15 janvier 2024")
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date en format francais court
 * @param dateString - Date au format ISO
 * @returns Date formatee (ex: "15/01/2024")
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

/**
 * Formate une date et heure en format francais
 * @param dateString - Date au format ISO
 * @returns Date et heure formatees (ex: "15/01/2024 a 14:30")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Pluralise un mot en francais (ajout simple de 's')
 * @param count - Nombre d'elements
 * @param singular - Mot au singulier
 * @param plural - Mot au pluriel (optionnel, defaut: singulier + 's')
 * @returns Texte avec nombre et mot pluralise
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count > 1 ? (plural || `${singular}s`) : singular;
  return `${count} ${word}`;
}

/**
 * Extrait le message d'une erreur de maniere securisee
 * @param error - Erreur (Error, string, ou autre)
 * @param fallback - Message par defaut
 * @returns Message d'erreur
 */
export function getErrorMessage(error: unknown, fallback: string = 'Une erreur est survenue'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Formate le nom complet d'un prospect
 * @param prospect - Objet avec nom, prenom, raison_sociale et type_prospect
 * @returns Nom complet formate
 */
/**
 * Nettoie et valide un numéro de téléphone saisi.
 * @returns Le numéro nettoyé si valide, ou null si invalide.
 */
export function cleanAndValidatePhone(input: string): string | null {
  const cleaned = input.trim().replace(/[\s\-().]/g, '');
  if (/^[+\d]{6,}$/.test(cleaned)) return cleaned;
  return null;
}

/**
 * Convertit un numéro de téléphone français en format E.164 (+33XXXXXXXXX)
 * Gère les formats : 0XXXXXXXXX, 33XXXXXXXXX, +33XXXXXXXXX
 * @param phone - Numéro de téléphone brut
 * @returns Numéro au format E.164
 */
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `+33${digits.slice(1)}`;
  }
  if (digits.startsWith('33') && digits.length === 11) {
    return `+${digits}`;
  }
  if (phone.startsWith('+')) {
    return phone.replace(/[^\d+]/g, '');
  }
  return `+${digits}`;
}

/**
 * Formate un montant en euros (ex: 1 200 €)
 */
export function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/**
 * Formate une heure "HH:MM:SS" en "HH:MM"
 */
export function formatHeure(heure: string): string {
  return heure.substring(0, 5);
}

export function formatProspectName(prospect: {
  nom: string;
  prenom?: string | null;
  raison_sociale?: string | null;
  type_prospect?: string;
}): string {
  if (prospect.type_prospect === 'Entreprise' && prospect.raison_sociale) {
    return prospect.raison_sociale;
  }
  return prospect.prenom ? `${prospect.prenom} ${prospect.nom}` : prospect.nom;
}

/**
 * Formate une heure "HH:MM" depuis une date ISO
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate une durée en secondes en "Xm Xs" ou "N/A"
 */
export function formatDurationFromSeconds(seconds: number | null): string {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

/**
 * Retourne la classe CSS associée à un statut d'appel
 */
export function getStatutAppelClass(statut: string): string {
  switch (statut) {
    case 'abouti':
    case 'vente_conclue':
    case 'rdv_pris':
      return 'appel-card__statut--success';
    case 'non_abouti':
    case 'pas_de_reponse':
    case 'occupe':
    case 'messagerie':
      return 'appel-card__statut--warning';
    case 'refus_definitif':
      return 'appel-card__statut--danger';
    default:
      return '';
  }
}

/** Labels français pour les statuts d'appel */
const STATUT_APPEL_LABELS: Record<string, string> = {
  abouti: 'Abouti',
  non_abouti: 'Non abouti',
  occupe: 'Occupé',
  pas_de_reponse: 'Pas de réponse',
  messagerie: 'Messagerie',
  rdv_pris: 'RDV pris',
  vente_conclue: 'Vente conclue',
  refus_definitif: 'Refus définitif',
  en_cours: 'En cours',
};

/**
 * Retourne le label français d'un statut d'appel
 */
export function getStatutAppelLabel(statut: string): string {
  return STATUT_APPEL_LABELS[statut] || statut;
}

const STATUT_PROSPECT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  interesse: 'Intéressé',
  rappel: 'Rappel',
  non_interesse: 'Non intéressé',
  vente_conclue: 'Vente conclue',
};

export function getStatutProspectLabel(statut: string): string {
  return STATUT_PROSPECT_LABELS[statut] || statut;
}

export function formatTimerDuration(depuis: Date): string {
  const secondes = Math.floor((Date.now() - depuis.getTime()) / 1000);
  const m = Math.floor(secondes / 60).toString().padStart(2, '0');
  const s = (secondes % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
