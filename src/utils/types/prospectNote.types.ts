export interface ProspectNote {
  id_note_prospect: number;
  id_prospect: number;
  id_campagne: 11;
  id_agent: number;
  id_appel: number | null;
  contenu: string;
  created_at: string;
  updated_at: string;
}
