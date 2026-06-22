export interface TypeProduit {
  id_type_produit: number;
  id_categorie: number;
  libelle_type: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produit {
  id_produit: number;
  code_produit?: string;
  nom_produit: string;
  description?: string;
  id_type_produit?: number | null;
  prix_unitaire?: string | number; // String from PostgreSQL NUMERIC
  prix_promo?: string | number;    // String from PostgreSQL NUMERIC
  id_categorie?: number;
  attributs_specifiques?: Record<string, unknown>;
  actif: boolean;
  format?: string;
  grammage?: string;
  couleur?: string;
  conditionnement?: string;
  photo?: string;
  quantite_lot?: number;
  created_at: string;
  updated_at: string;
  categorie?: CategorieProduit; // Relation optionnelle avec la catégorie (lowercase pour correspondre à l'API)
  Categorie?: CategorieProduit; // Alias pour compatibilité avec le code existant
  typeProduit?: TypeProduit; // Relation avec le type de produit
  tarif?: Tarif; // Tarif spécifique à la campagne
  type_produit?: string | null;
}

export interface CategorieProduit {
  id_categorie: number;
  nom_categorie: string;
  description?: string;
  id_parent?: number | null;
  niveau?: number;
  created_at?: string;
  updated_at?: string;
  sousCategories?: CategorieProduit[];
  produits?: Produit[];
  categorieParente?: CategorieProduit;
}

export type CategorieTreeResponse = CategorieProduit[];

export interface CategoriePathResponse {
  path: CategorieProduit[];
  pathString: string;
}

export interface ProduitsGroupedData {
  categories: CategorieProduit[];
  mode: 'grouped';
  count: {
    categories: number;
    totalProducts: number;
  };
}

export interface CartItem {
  produit: Produit;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  panier_source_ids?: number[];
  panier_source_labels?: string[];
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface CampaignPanier {
  id_panier: number;
  label: string;
  origine: string;
  actif: boolean;
  produits: Produit[];
  total_produits: number;
  montant_estime_ht: number;
  has_missing_price: boolean;
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
