import { useState, useEffect } from 'react';

/**
 * Retourne un message d'accueil contextuel selon l'heure, le jour et le prénom.
 * Les commerciaux ANTL travaillent du lundi au jeudi.
 *
 * @param prenom - Prénom de l'utilisateur connecté
 * @param _heure - Heure optionnelle pour tests (0-23). Utilise l'heure réelle si absent.
 * @param _jour  - Jour optionnel pour tests (0=dim…6=sam). Utilise le jour réel si absent.
 */
export function getSalutation(prenom?: string, _heure?: number, _jour?: number): string {
  const now   = new Date();
  const h     = _heure !== undefined ? _heure : now.getHours();
  const jour  = _jour  !== undefined ? _jour  : now.getDay(); // 0=dim, 1=lun … 4=jeu
  const p     = prenom ? ` ${prenom}` : "";

  // Nuit tardive — 0h à 5h
  if (h < 5)  return `Vous êtes couché·e très tard${p} !`;

  // Tôt le matin — 5h à 9h
  if (h < 9)  return `Belle matinée${p}, on attaque !`;

  // Matinée — 9h à 12h
  if (h < 12) {
    if (jour === 1) return `Belle semaine en perspective${p} !`;
    if (jour === 4) return `Dernier grand jour de la semaine${p}, on y va !`;
    return `Bonjour${p} !`;
  }

  // Pause déjeuner — 12h à 14h
  if (h < 14) return `Bon appétit${p} !`;

  // Après-midi — 14h à 18h
  if (h < 18) {
    if (jour === 4) return `Le weekend approche${p}, plus que quelques appels !`;
    return `Bon après-midi${p} !`;
  }

  // Soirée — 18h à 21h
  if (h < 21) return `Bonne soirée${p} !`;

  // Nuit — 21h+
  return `Encore au bureau${p} ? Rentrez vous reposer !`;
}

/**
 * Formate un nombre sur 2 chiffres (ajoute un 0 devant si nécessaire)
 * @param number - Nombre à formater
 * @returns Nombre formaté sur 2 chiffres
 */
function formatTwoDigits(number: number): string {
  return number.toString().padStart(2, '0');
}

/**
 * Retourne l'heure actuelle au format HH:MM:SS
 * @returns Chaîne formatée de l'heure
 */
export function getFormattedTime(): string {
  const now = new Date();
  const hours = formatTwoDigits(now.getHours());
  const minutes = formatTwoDigits(now.getMinutes());
  const seconds = formatTwoDigits(now.getSeconds());
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Hook React pour afficher l'heure en temps réel
 * @param interval - Intervalle de mise à jour en millisecondes (défaut: 1000ms)
 * @returns L'heure actuelle au format HH:MM:SS qui se met à jour automatiquement
 */
export function useClock(interval: number = 1000): string {
  const [time, setTime] = useState<string>(getFormattedTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(getFormattedTime());
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return time;
}

/**
 * Construit une query string à partir d'un objet de paramètres
 * Filtre les valeurs undefined/null et convertit les nombres en strings
 * @param params - Objet contenant les paramètres de la requête
 * @returns Query string formatée (avec le '?' au début) ou chaîne vide
 *
 * @example
 * buildQueryString({ page: 1, limit: 20, search: 'test' })
 * // Returns: "?page=1&limit=20&search=test"
 *
 * buildQueryString({ page: 1, search: undefined })
 * // Returns: "?page=1"
 *
 * buildQueryString({})
 * // Returns: ""
 */
export function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';

  const filteredParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      filteredParams[key] = String(value);
    }
  });

  const entries = Object.keys(filteredParams);
  if (entries.length === 0) return '';

  return '?' + new URLSearchParams(filteredParams).toString();
}

/**
 * Formate un montant en devise EUR avec le format francais
 * @param amount - Montant a formater
 * @returns Montant formate (ex: "1 234,56 €")
 *
 * @example
 * formatCurrency(1234.56)
 * // Returns: "1 234,56 €"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Calcule le total d'une ligne (prix * quantite - remise)
 * @param prixUnitaire - Prix unitaire du produit
 * @param quantite - Quantite commandee
 * @param remise - Remise appliquee (defaut: 0)
 * @returns Total de la ligne
 *
 * @example
 * calculateLineTotal(10, 3, 5)
 * // Returns: 25 (10 * 3 - 5)
 */
export function calculateLineTotal(prixUnitaire: number, quantite: number, remise: number = 0): number {
  return prixUnitaire * quantite - remise;
}

/**
 * Parse un prix qui peut etre string ou number en number
 * Gere les valeurs retournees par PostgreSQL NUMERIC
 * @param price - Prix en string ou number
 * @param defaultValue - Valeur par defaut si parsing echoue (defaut: 0)
 * @returns Prix en number
 *
 * @example
 * parsePrice("123.45")
 * // Returns: 123.45
 * parsePrice(123.45)
 * // Returns: 123.45
 * parsePrice(undefined)
 * // Returns: 0
 */
export function parsePrice(price: string | number | undefined | null, defaultValue: number = 0): number {
  if (price === undefined || price === null) {
    return defaultValue;
  }
  if (typeof price === 'number') {
    return price;
  }
  const parsed = parseFloat(price);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Determine le type de fiche en fonction du statut du prospect
 * @param statut - Statut du prospect
 * @returns Type de fiche (client, jamais_appele, deja_appele, recycle)
 */
export function getTypeFiche(statut: string): 'client' | 'jamais_appele' | 'deja_appele' | 'recycle' {
  if (statut === 'vente_conclue') {
    return 'client';
  }
  if (statut === 'nouveau') {
    return 'jamais_appele';
  }
  if (statut === 'non_interesse') {
    return 'recycle';
  }
  return 'deja_appele';
}

/**
 * Extrait le prix unitaire d'un produit en tenant compte du tarif campagne
 * @param produit - Objet produit avec potentiellement un tarif
 * @returns Prix unitaire (tarif > produit > 0)
 */
export function getProductPrice(produit: {
  prix_unitaire?: string | number;
  tarif?: { prix_unitaire?: string | number };
}): number {
  // Priorité au tarif (prix spécifique campagne)
  if (produit.tarif?.prix_unitaire !== undefined && produit.tarif?.prix_unitaire !== null) {
    return parsePrice(produit.tarif.prix_unitaire);
  }
  // Sinon prix du produit
  return parsePrice(produit.prix_unitaire);
}

/**
 * Extrait le prix promo d'un produit en tenant compte du tarif campagne
 * @param produit - Objet produit avec potentiellement un tarif
 * @returns Prix promo ou null si pas de promo
 */
export function getProductPromoPrice(produit: {
  prix_promo?: string | number;
  tarif?: { prix_promo?: string | number };
}): number | null {
  // Priorité au tarif (prix spécifique campagne)
  if (produit.tarif?.prix_promo !== undefined && produit.tarif?.prix_promo !== null) {
    const promo = parsePrice(produit.tarif.prix_promo);
    return promo > 0 ? promo : null;
  }
  // Sinon prix promo du produit
  if (produit.prix_promo !== undefined && produit.prix_promo !== null) {
    const promo = parsePrice(produit.prix_promo);
    return promo > 0 ? promo : null;
  }
  return null;
}