export interface Objection {
  id_objection: number;
  id_campagne: number;
  categorie: string | null;
  titre: string;
  texte_objection: string | null;
  texte_reponse: string;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ObjectionsByCategorie {
  categorie: string;
  objections: Objection[];
}
