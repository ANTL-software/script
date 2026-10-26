import type { ScriptSupport, Objection, PlanAppelEtape } from '../../utils/types/index.ts';
export function supportToPlan(support: ScriptSupport, campaignId: number): PlanAppelEtape[] {
  return support.items.map((item, index) => ({ id_plan: index + 1, id_campagne: campaignId, etape: index + 1,
    titre: item.titre, contenu: item.contenu, ordre_affichage: index, actif: true, created_at: '', updated_at: '' }));
}
export function supportToObjections(support: ScriptSupport, campaignId: number): Objection[] {
  return support.items.map((item, index) => ({ id_objection: index + 1, id_campagne: campaignId,
    titre: item.titre, texte_reponse: item.contenu, categorie: item.categorie || null,
    texte_objection: item.texte_objection || null, reformulation: item.reformulation || null, adaptation: item.adaptation || null,
    ordre_affichage: index, actif: true, created_at: '', updated_at: '' }));
}
