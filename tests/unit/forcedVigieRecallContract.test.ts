import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('un rappel forcé de Vigie est rouge, non modifiable et porte son motif au commercial', async () => {
  const [calendarSource, dialerSource, detailsSource] = await Promise.all([
    readFile(path.join(process.cwd(), 'src/views/components/agentCalendar/AgentCalendar.tsx'), 'utf8'),
    readFile(path.join(process.cwd(), 'src/context/dialerContext/DialerProvider.tsx'), 'utf8'),
    readFile(path.join(process.cwd(), 'src/views/components/rendezVousDetailsModal/RendezVousDetailsModal.tsx'), 'utf8'),
  ]);

  assert.match(calendarSource, /is_rappel_force: isRappelForce/);
  assert.match(calendarSource, /RENDEZ_VOUS_KIND_COLORS\.rappelForce/);
  assert.match(calendarSource, /event\.resource\.is_rappel_force === true/);
  assert.match(dialerSource, /candidate\.est_rappel_force && candidate\.motif_rappel_force/);
  assert.match(dialerSource, /title: 'Rappel forcé par la supervision'/);
  assert.match(dialerSource, /acknowledgeOnly: true/);
  assert.match(detailsSource, /Message du superviseur/);
});
