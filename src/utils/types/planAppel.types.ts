export interface PlanAppelEtape {
  id_plan: number;
  id_campagne: number;
  etape: number;
  titre: string;
  contenu: string;
  ordre_affichage: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanAppelResponse {
  success: boolean;
  data: PlanAppelEtape[];
  count: number;
}
