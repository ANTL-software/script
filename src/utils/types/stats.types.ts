export interface PalierPrime {
  seuil_pourcentage: number;
  montant_prime: number;
  debloque: boolean;
}

export interface PrimeStats {
  niveau: 'debutant' | 'confirme' | 'expert';
  libelle: string;
  salaire_fixe: number;
  objectif_mensuel: number;
  pourcentage_atteint: number;
  prime_debloquee: number;
  paliers: PalierPrime[];
}

export interface StatsDuJour {
  date: string;
  appels_total: number;
  appels_aboutis: number;
  ventes: number;
  rdv_pris: number;
  taux_conversion: number;
  ventes_jour_montant: number;
  ventes_mois_count: number;
  ventes_mois_montant: number;
  prime: PrimeStats | null;
}
