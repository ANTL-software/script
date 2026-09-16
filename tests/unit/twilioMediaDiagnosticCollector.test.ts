import assert from 'node:assert/strict';
import test from 'node:test';

import { TwilioMediaDiagnosticCollector } from '../../src/context/dialerContext/TwilioMediaDiagnosticCollector.ts';
import type { CallMediaDiagnostic } from '../../src/utils/types/appel.types.ts';

const firstSample = {
  bytesReceived: 1200,
  bytesSent: 1400,
  audioOutputLevel: 8000,
  packetsLost: 0,
  jitter: 0.02,
  rtt: 75,
};

test('agrège les mesures entrantes en tranches de cinq secondes liées à l’appel', async () => {
  const writes: CallMediaDiagnostic[] = [];
  const collector = new TwilioMediaDiagnosticCollector(46833, 'dublin', async (_id, payload) => {
    writes.push(payload);
  }, 1000000);

  collector.recordSample(firstSample, 1001000);
  collector.recordSample({ ...firstSample, bytesReceived: 0, audioOutputLevel: 0 }, 1002000);
  collector.recordSample({ ...firstSample, bytesReceived: 0, audioOutputLevel: 0 }, 1006000);
  collector.recordEvent('warning', 'low-bytes-received', 1006000);
  await collector.flush();
  collector.finish(1007000);

  assert.equal(writes[0].edge, 'dublin');
  assert.equal(writes[0].samples.length, 2);
  assert.deepEqual(writes[0].samples.map((sample) => sample.second), [0, 5]);
  assert.equal(writes[0].samples[0].zeroReceivedSamples, 1);
  assert.equal(writes[0].samples[1].zeroReceivedSamples, 1);
  assert.equal(writes[0].events[0].name, 'low-bytes-received');
  assert.equal(writes[0].acceptedAt, new Date(1000000).toISOString());
});

test('borne la chronologie et normalise les noms techniques', async () => {
  const collector = new TwilioMediaDiagnosticCollector(46738, 'invalid edge!', async () => {}, 1000000);
  for (let index = 0; index < 730; index += 1) {
    collector.recordSample(firstSample, 1000000 + index * 5000);
  }
  for (let index = 0; index < 65; index += 1) {
    collector.recordEvent('warning', 'unexpected text with spaces!', 1000000 + index * 1000);
  }
  const snapshot = collector.snapshot();
  collector.finish(1100000);

  assert.equal(snapshot.edge, null);
  assert.equal(snapshot.samples.length, 720);
  assert.equal(snapshot.events.length, 60);
  assert.match(snapshot.events[0].name ?? '', /^[A-Za-z0-9_-]+$/);
  assert.equal(JSON.stringify(snapshot).includes('conversation'), false);
});

test('un échec de sauvegarde ne bloque ni les mesures suivantes ni la fin de l’appel', async () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  let attempts = 0;
  try {
    const collector = new TwilioMediaDiagnosticCollector(46833, null, async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('API indisponible');
    }, 1000000);

    collector.recordSample(firstSample, 1001000);
    await assert.doesNotReject(collector.flush());
    collector.recordSample(null, 1002000);
    collector.recordSample(firstSample, 1006000);
    await assert.doesNotReject(collector.flush());
    collector.finish(1007000);

    assert.equal(attempts, 3);
    assert.equal(collector.snapshot().samples.length, 2);
  } finally {
    console.warn = originalWarn;
  }
});
