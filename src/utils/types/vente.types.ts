import type { Produit } from './cart.types';

export type StatutVente = 'en_attente' | 'validee' | 'annulee';
export type ModePaiement = 'CB' | 'Prelevement' | 'Cheque' | 'Virement';

export interface DetailVente {
  id_detail?: number;
  id_produit: number;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  montant_ligne?: number;
  Produit?: Produit; // Relation optionnelle avec le produit
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
  details?: DetailVente[];
  DetailsVentes?: DetailVente[]; // Alias Sequelize pour les détails
}

export interface CreateVenteData {
  id_prospect: number;
  id_campagne: number;
  id_appel?: number;
  mode_paiement?: ModePaiement;
  details: Omit<DetailVente, 'id_detail' | 'montant_ligne'>[];
}
