export interface Produit {
  id_produit: number;
  nom_produit: string;
  description?: string;
  prix_base: number;
  id_categorie?: number;
  attributs_specifiques?: Record<string, unknown>;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategorieProduit {
  id_categorie: number;
  nom_categorie: string;
  description?: string;
}

export interface CartItem {
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  remise: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface Tarif {
  id_tarif: number;
  id_produit: number;
  id_campagne?: number;
  prix: number;
  date_debut: string;
  date_fin?: string;
}
