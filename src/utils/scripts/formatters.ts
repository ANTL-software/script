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
