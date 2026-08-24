import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();

test('le raccrochage manuel force le transport et le workflow même si le suivi local est incohérent', async () => {
  const source = await readFile(
    path.join(ROOT, 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );
  const hangupSource = source.slice(
    source.indexOf('const hangup = useCallback'),
    source.indexOf('// Répondre'),
  );

  assert.match(hangupSource, /finishAsteriskCall\('ended', 'asterisk_manual_hangup', true\)/);
  assert.match(hangupSource, /finishTwilioCall\('twilio_manual_hangup', true\)/);
  assert.match(hangupSource, /activeCall\?\.disconnect\(\)/);
  assert.match(hangupSource, /device\.disconnectAll\(\)/);
  assert.doesNotMatch(hangupSource, /if \(!isCallActiveRef\.current\)/);
  assert.doesNotMatch(hangupSource, /if \(!device\) \{[\s\S]*?return;/);
});

test('une fin Twilio confirmée par le backend ou par le SDK converge vers la même finalisation', async () => {
  const source = await readFile(
    path.join(ROOT, 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );

  assert.match(source, /call\.on\('disconnect',[\s\S]*finishTwilioCall\('twilio_disconnect'\)/);
  assert.match(source, /call\.on\('error',[\s\S]*Call\.State\.Closed[\s\S]*finishTwilioCall\('twilio_call_error_closed'\)/);
  assert.match(source, /if \(nextInsights\.endReason\) \{[\s\S]*finishTwilioCall\('twilio_backend_terminal_state'\)/);
  assert.match(source, /callEndFinalizedRef\.current = true/);
});

test('la closing conserve le marqueur de la tentative courante pendant le chargement de la fiche', async () => {
  const source = await readFile(
    path.join(ROOT, 'src/hooks/useLandingPage.ts'),
    'utf8',
  );

  assert.match(source, /currentAppelProspectId === currentProspect\.id_prospect/);
  assert.match(source, /\(wasCallActiveRef\.current \|\| isCallActive\)[\s\S]*&& callMatchesCurrentProspect/);
  assert.match(source, /if \(!wasCallActiveRef\.current\) return/);
});
