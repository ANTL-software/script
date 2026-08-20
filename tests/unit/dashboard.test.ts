import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAssignedProspectUrl,
  buildDashboardRappelUrl,
  buildDashboardRendezVousItems,
  resolveAssignedProspectAction,
} from '../../src/utils/scripts/dashboard.ts';
import type { RendezVous } from '../../src/utils/types/rendezVous.types.ts';

function createRendezVous(
  id: number,
  heure: string,
  options: {
    motif?: string | null;
    statutAppelSource?: string;
    withProspect?: boolean;
  } = {},
): RendezVous {
  return {
    id_rendez_vous: id,
    id_agent: 5,
    id_prospect: id + 100,
    id_campagne: 7,
    date_rdv: '2026-07-17',
    heure_rdv: heure,
    motif: options.motif ?? null,
    notes: null,
    statut: 'planifie',
    created_at: '2026-07-17T08:00:00.000Z',
    updated_at: '2026-07-17T08:00:00.000Z',
    prospect: options.withProspect === false
      ? undefined
      : {
          id_prospect: id + 100,
          nom: 'Martin',
          prenom: 'Alice',
          telephone: '0123456789',
        },
    appelsSource: options.statutAppelSource
      ? [{ id_appel: id + 200, statut_appel: options.statutAppelSource }]
      : [],
  };
}

test('buildAssignedProspectUrl conserve les parcours auto et rappel privé', () => {
  assert.equal(buildAssignedProspectUrl(42), '/prospect/42');
  assert.equal(
    buildAssignedProspectUrl(42, 18),
    '/prospect/42?source=rappel&rdvId=18&autoReminder=1',
  );
});

test('resolveAssignedProspectAction ne déclenche jamais un appel automatique pour un rappel privé ou pour la campagne FGA Consulting (11)', () => {
  assert.deepEqual(resolveAssignedProspectAction(42, 'auto', null, 1), {
    url: '/prospect/42',
    shouldStartCall: true,
  });
  assert.deepEqual(resolveAssignedProspectAction(42, 'rappel', 18, 1), {
    url: '/prospect/42?source=rappel&rdvId=18&autoReminder=1',
    shouldStartCall: false,
  });
  assert.deepEqual(resolveAssignedProspectAction(42, 'auto', null, 11), {
    url: '/prospect/42',
    shouldStartCall: false,
  });
});

test('buildDashboardRappelUrl cible le prospect et le rendez-vous sélectionnés', () => {
  assert.equal(
    buildDashboardRappelUrl(createRendezVous(9, '10:30:00')),
    '/prospect/109?source=rappel&rdvId=9',
  );
  assert.equal(
    buildDashboardRappelUrl(createRendezVous(10, '10:45:00', { withProspect: false })),
    null,
  );
});

test('buildDashboardRendezVousItems identifie le prochain rappel sans réordonner la liste', () => {
  const items = buildDashboardRendezVousItems(
    [
      createRendezVous(3, '11:00:00', { motif: 'Commande à établir' }),
      createRendezVous(1, '09:00:00'),
      createRendezVous(2, '10:15:00', { statutAppelSource: 'vente_conclue' }),
    ],
    new Date(2026, 6, 17, 10, 0),
  );

  assert.deepEqual(items.map((item) => item.rendezVous.id_rendez_vous), [3, 1, 2]);
  assert.equal(items.find((item) => item.isNext)?.rendezVous.id_rendez_vous, 2);
  assert.equal(items[0].isCommande, true);
  assert.equal(items[0].isRelanceVente, false);
  assert.equal(items[2].isCommande, false);
  assert.equal(items[2].isRelanceVente, true);
  assert.equal(items[2].prospectLabel, 'Alice Martin');
  assert.equal(items[2].heureLabel, '10:15');
});

test('buildDashboardRendezVousItems fournit un fallback sans prospect', () => {
  const [item] = buildDashboardRendezVousItems(
    [createRendezVous(4, '15:00:00', { withProspect: false })],
    new Date(2026, 6, 17, 14, 0),
  );

  assert.equal(item.prospectLabel, 'Prospect inconnu');
  assert.equal(item.url, null);
});
