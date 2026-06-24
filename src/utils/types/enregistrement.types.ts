export interface EnregistrementAppel {
  id_enregistrement: number;
  id_appel: number;
  id_agent: number;
  nom_fichier: string;
  taille_octets: number;
  duree_secondes?: number | null;
  mime_type: string;
  created_at?: string;
  updated_at?: string;
}
