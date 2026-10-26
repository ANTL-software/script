export type ScriptSupportKind = 'plan-appel' | 'objections' | 'qui-sommes-nous';
export interface ScriptSupportItem {
  titre: string;
  contenu: string;
  categorie?: string;
  texte_objection?: string;
  reformulation?: string;
  adaptation?: string;
}
export interface ScriptSupport {
  items: ScriptSupportItem[];
  revision: number;
  source: 'usv' | 'base' | 'historique';
  nom_campagne: string;
}
