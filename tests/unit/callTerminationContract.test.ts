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
  assert.match(source, /if \(appel\.end_reason\) \{[\s\S]*finishTwilioCall\('twilio_backend_terminal_state'\)/);
  assert.match(source, /callEndFinalizedRef\.current = true/);
});

test('Twilio privilégie un transport voix résilient et ne dépend plus de la qualification AMD', async () => {
  const source = await readFile(
    path.join(ROOT, 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );

  assert.match(source, /codecPreferences: \[Call\.Codec\.Opus, Call\.Codec\.PCMU\]/);
  assert.match(source, /dscp: true/);
  assert.match(source, /enableImprovedSignalingErrorPrecision: true/);
  assert.match(source, /maxCallSignalingTimeoutMs: 30000/);
  assert.match(source, /tokenRefreshMs: 30000/);
  assert.match(source, /closeProtection: true/);
  assert.doesNotMatch(source, /currentCallInsights|setCurrentCallInsights|pollInsights|call_classification|amd_status/);
  assert.match(source, /call\.on\('accept',[\s\S]*setStatut\('en_appel'\)/);
});

test('le diagnostic média reste attaché à l’appel et ne commande jamais sa fin', async () => {
  const source = await readFile(
    path.join(ROOT, 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );

  assert.match(source, /call\.on\('sample', \(sample\) => \{[\s\S]*callDiagnostic\?\.recordSample\(sample\)/);
  assert.match(source, /call\.on\('warning', \(name, data\) => \{[\s\S]*callDiagnostic\?\.recordEvent\('warning', name\)/);
  assert.match(source, /const finishTwilioCall = useCallback[\s\S]*mediaDiagnosticsRef\.current\?\.finish\(\)/);
  assert.doesNotMatch(source, /call\.on\('sample',[\s\S]*?call\.disconnect\(\)/);
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
