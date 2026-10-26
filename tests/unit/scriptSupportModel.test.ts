import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { supportToPlan, supportToObjections } from '../../src/API/models/scriptSupport.model.ts';
import type { ScriptSupport } from '../../src/utils/types/scriptSupport.types.ts';
import { CIGALES_PLAN_APPEL, MMA_PLAN_APPEL, FGA_PLAN_APPEL } from '../../src/utils/scripts/staticPlanAppel.ts';
import { CIGALES_OBJECTIONS, MMA_OBJECTIONS, FGA_OBJECTIONS } from '../../src/utils/scripts/staticObjections.ts';
const empty: ScriptSupport = { items: [], revision: 1, source: 'usv', nom_campagne: 'Campagne' };
test('un support explicitement vide reste vide dans les deux lecteurs', () => {
  assert.deepEqual(supportToPlan(empty, 7), []);
  assert.deepEqual(supportToObjections(empty, 7), []);
});
test('ordre, paragraphes, phases de réponse et campagne sont conservés', () => {
  const support: ScriptSupport = { ...empty, items: [{ titre: 'A', contenu: 'Texte\nexact', categorie: 'BESOIN', reformulation: 'Écouter', adaptation: 'Adapter' }, { titre: 'B', contenu: 'Fin' }] };
  assert.deepEqual(supportToPlan(support, 15).map((item) => [item.id_campagne, item.etape, item.contenu]), [[15, 1, 'Texte\nexact'], [15, 2, 'Fin']]);
  const objection = supportToObjections(support, 15)[0];
  assert.equal(objection.texte_reponse, 'Texte\nexact');
  assert.equal(objection.reformulation, 'Écouter');
  assert.equal(objection.adaptation, 'Adapter');
});
test('les instantanés Olympe reproduisent intégralement les plans et objections historiques', () => {
  const legacy = JSON.parse(readFileSync(new URL('../../../olympe/assets/script-supports/legacy.json', import.meta.url), 'utf8'));
  assert.deepEqual(legacy, {
    CIGALES: { plan: CIGALES_PLAN_APPEL, objections: CIGALES_OBJECTIONS },
    MMA: { plan: MMA_PLAN_APPEL, objections: MMA_OBJECTIONS },
    FGA: { plan: FGA_PLAN_APPEL, objections: FGA_OBJECTIONS },
  });
});
