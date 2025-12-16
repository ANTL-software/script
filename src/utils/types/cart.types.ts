export interface Produit {
  id_produit: number;
  code_produit?: string;
  nom_produit: string;
  description?: string;
  type_produit?: string;
  prix_unitaire?: string | number; // String from PostgreSQL NUMERIC
  prix_promo?: string | number;    // String from PostgreSQL NUMERIC
  id_categorie?: number;
  attributs_specifiques?: Record<string, unknown>;
  actif: boolean;
  created_at: string;
  updated_at: string;
  categorie?: CategorieProduit; // Relation optionnelle avec la catégorie (lowercase pour correspondre à l'API)
  Categorie?: CategorieProduit; // Alias pour compatibilité avec le code existant
  tarif?: Tarif; // Tarif spécifique à la campagne
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
  id_produit?: number;
  id_campagne?: number;
  prix_unitaire?: string | number;  // String from PostgreSQL NUMERIC
  prix_promo?: string | number;     // String from PostgreSQL NUMERIC
  date_debut_validite?: string;
  date_fin_validite?: string;
  devise?: string;
  created_at?: string;
  updated_at?: string;
}
