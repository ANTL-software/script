export interface SeuilPrimeStats {
  seuil_pourcentage: number;
  objectif_palier: number;
  montant_prime: number;
  montant_total: number;
  debloque: boolean;
}

export interface PrimeStats {
  niveau: 1 | 2 | 3;
  code_niveau: 'palier_1' | 'palier_2' | 'palier_3';
  libelle: string;
  type_campagne: 'vente' | 'lead_b2b';
  unite_objectif: 'euro' | 'lead';
  salaire_fixe: number;
  objectif: number;
  valeur_realisee: number;
  pourcentage_atteint: number;
  prime_debloquee: number;
  remuneration_totale: number;
  paliers: SeuilPrimeStats[];
}

export interface ProgpaEtapeStat {
  progpa: number | '5+';
  label: string;
  count: number;
  pourcentage: number;
}

export interface StatsDuJour {
  date: string;
  type_campagne?: 'vente' | 'lead_b2b' | string;
  appels_total: number;
  appels_aboutis: number;
  ventes: number;
  rdv_pris: number;
  rendez_vous_pris: number;
  taux_conversion: number;
  ventes_jour_montant: number;
  ventes_jour_en_attente_count?: number;
  ventes_jour_en_attente_montant?: number;
  ventes_jour_validees_count?: number;
  ventes_jour_validees_montant?: number;
  leads_jour_count?: number;
  leads_mois_count?: number;
  ventes_mois_count: number;
  ventes_mois_montant: number;
  ventes_mois_en_attente_count?: number;
  ventes_mois_en_attente_montant?: number;
  prime: PrimeStats | null;
  progpa_etapes?: ProgpaEtapeStat[];
}
