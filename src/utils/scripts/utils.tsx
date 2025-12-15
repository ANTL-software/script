import { useState, useEffect } from 'react';

/**
 * Retourne une salutation appropriée en fonction de l'heure actuelle
 * @param heure - Heure optionnelle pour tester (0-23). Si non fournie, utilise l'heure actuelle
 * @returns "Bonjour" ou "Bonsoir"
 */
export function getSalutation(heure?: number): string {
  // Si aucune heure n'est fournie, on utilise l'heure actuelle
  const heureActuelle = heure !== undefined ? heure : new Date().getHours();

  // Bonsoir à partir de 18h (6 PM), sinon Bonjour
  return heureActuelle >= 18 ? "Bonsoir" : "Bonjour";
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