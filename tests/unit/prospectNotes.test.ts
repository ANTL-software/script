import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveClosingNotes,
  supportsStandaloneProspectNotes,
} from '../../src/utils/scripts/prospectNotes.ts';

test('les notes autonomes sont strictement reservees a FGA Consulting', () => {
  assert.equal(supportsStandaloneProspectNotes(11), true);
  assert.equal(supportsStandaloneProspectNotes(7), false);
  assert.equal(supportsStandaloneProspectNotes(9), false);
  assert.equal(supportsStandaloneProspectNotes(null), false);
});

test('le closing FGA reprend la note autonome sans modifier le flux des autres campagnes', () => {
  assert.equal(resolveClosingNotes(11, 'Brouillon appel', 'Note FGA avant appel'), 'Note FGA avant appel');
  assert.equal(resolveClosingNotes(7, 'Note Cigales en appel', 'Note hors appel'), 'Note Cigales en appel');
  assert.equal(resolveClosingNotes(9, 'Note MMA en appel', 'Note hors appel'), 'Note MMA en appel');
});
