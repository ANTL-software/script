import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('le dialer Asterisk conserve le pipeline BDD puis session puis INVITE corrélé', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );
  const createIndex = source.indexOf('const appel = await appelService.createAppel({');
  const sessionIndex = source.indexOf('await dialerService.startSession(prospectId, campagneId);', createIndex);
  const inviteIndex = source.indexOf('await asteriskClient.call(formattedNumber, {', sessionIndex);

  assert.ok(createIndex >= 0, 'la tentative doit être créée en BDD');
  assert.match(source.slice(createIndex, sessionIndex), /telephony_provider: telephonyProvider/);
  assert.ok(sessionIndex > createIndex, 'la session doit référencer la tentative créée');
  assert.ok(inviteIndex > sessionIndex, 'l INVITE ne part qu après la session backend');
  assert.match(source, /onCallAnswered:[\s\S]*state: 'answered'/);
  const createdHandler = source.slice(
    source.indexOf('onCallCreated:'),
    source.indexOf('onCallAnswered:'),
  );
  const answeredHandler = source.slice(
    source.indexOf('onCallAnswered:'),
    source.indexOf('onCallHangup:'),
  );
  assert.doesNotMatch(createdHandler, /answered = true/);
  assert.match(answeredHandler, /answered = true/);
  assert.match(source, /onCallHangup: \(\) => finishAsteriskCall\('ended'/);
  assert.match(source, /finishAsteriskCall\('failed', 'asterisk_call_start_failed'\)/);
  assert.match(source, /setStatut\('pause_apres_appel'\)/);
});

test('le client SIP transporte les identifiants de corrélation dans chaque INVITE', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/API/services/Asterisk.service.ts'),
    'utf8',
  );

  assert.match(source, /X-ANTL-Appel-Id/);
  assert.match(source, /X-ANTL-Provider-Call-Id/);
  assert.match(source, /extraHeaders/);
});

test('la bascule provider est reprise à chaud sans couper un appel actif', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );

  assert.match(source, /providerChanged && isCallActiveRef\.current/);
  assert.match(source, /Bascule vers[\s\S]*en attente de la fin de l’appel/);
  assert.match(source, /window\.setInterval\(synchronizeProvider, 15000\)/);
  assert.match(source, /Bascule téléphonie vers[\s\S]*prise en compte/);
  assert.match(source, /reportTelephonyDegraded\('asterisk'/);
  assert.match(source, /reportTelephonyDegraded\('twilio'/);
  assert.match(source, /Service téléphonique[\s\S]*rétabli/);
});

test('les alertes qualité Twilio sont enregistrées en log sans notification toast utilisateur', async () => {
  const source = await readFile(
    path.join(process.cwd(), 'src/context/dialerContext/DialerProvider.tsx'),
    'utf8',
  );

  assert.match(source, /twilioMediaWarningsRef\.current\.add\(name\)/);
  assert.doesNotMatch(source, /showToast\('warning', 'Qualité audio téléphonique dégradée/);
  assert.doesNotMatch(source, /showToast\('info', 'Qualité audio téléphonique rétablie/);
});
