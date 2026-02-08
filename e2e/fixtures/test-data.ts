/**
 * Donnees de test pour les E2E
 * Basees sur les seeders du backend olympe
 */

// Utilisateur de test (seeder: 20241130000002-seed-employes.js)
// Format identifiant: 5 lettres + 3 chiffres (ex: mdupo001)
export const testUser = {
  identifiant: 'mdupo001',
  password: 'password123',
  nom: 'Dupont',
  prenom: 'Marie',
};

// Utilisateur invalide pour tests d'erreur
export const invalidUser = {
  identifiant: 'wrong001',
  password: 'wrongpassword',
};

// IDs de test (correspondent aux seeders)
export const testIds = {
  prospectId: 1,
  campagneId: 1,
  produitId: 1,
  categorieId: 1,
};

// Prospect de test (pour closing modal)
export const testProspect = {
  id: 1,
  nom: 'Martin',
  prenom: 'Jean',
  fullName: 'Jean Martin',
  telephone: '0612345678',
};

// Donnees de commande de test
export const testOrder = {
  adresse: '123 Rue de Test',
  code_postal: '75001',
  ville: 'Paris',
  pays: 'France',
  mode_paiement: 'Cheque' as const,
};

// Donnees de rendez-vous de test
export const testRendezVous = {
  motif: 'Rappel client',
  notes: 'Test automatise',
};

// Donnees d'appel de test
export const testAppel = {
  statut: 'vente_conclue' as const,
  notes: 'Vente reussie - test automatise',
};

// URL de l'API
export const API_BASE_URL = 'http://localhost:8800/api';

// Timeouts
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
};

// Helper pour generer une date future
export function getFutureDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Helper pour generer une heure
export function getTestTime(): string {
  return '14:00';
}
