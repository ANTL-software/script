import type { Produit } from './cart.types';

export type StatutVente = 'en_attente' | 'validee' | 'annulee';
export type ModePaiement = 'Prelevement' | 'Cheque' | 'Virement';

export interface DetailVente {
  id_detail?: number;
  id_produit: number;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  montant_ligne?: number;
  produit?: Produit; // Relation optionnelle avec le produit (minuscule = Sequelize)
}

export interface Vente {
  id_vente: number;
  id_prospect: number;
  id_agent: number;
  id_campagne: number;
  id_appel?: number | null;
  date_vente: string;
  montant_total: number;
  mode_paiement?: ModePaiement | null;
  statut: StatutVente;
  created_at: string;
  updated_at: string;
  details?: DetailVente[]; // Alias Sequelize pour les détails de vente
  adresse_facturation?: string;
  adresse_livraison?: string;
  code_postal_facturation?: string;
  code_postal_livraison?: string;
  ville_facturation?: string;
  ville_livraison?: string;
  pays_facturation?: string;
  pays_livraison?: string;
  notes?: string;
  livraison_offerte?: boolean;
  plage_horaire_livraison?: string;
}

export type DelaisLivraison = 2 | 4;

export interface CreateVenteData {
  id_prospect: number;
  id_campagne: number;
  id_appel?: number;
  mode_paiement?: ModePaiement;
  delais_livraison?: DelaisLivraison;
  adresse_facturation?: string;
  adresse_livraison?: string;
  code_postal_facturation?: string;
  code_postal_livraison?: string;
  ville_facturation?: string;
  ville_livraison?: string;
  pays_facturation?: string;
  pays_livraison?: string;
  notes?: string;
  livraison_offerte?: boolean;
  plage_horaire_livraison?: string;
  details: Omit<DetailVente, 'id_detail' | 'montant_ligne'>[];
}
