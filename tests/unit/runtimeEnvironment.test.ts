import assert from 'node:assert/strict';
import test, { after } from 'node:test';

import { isTestEnvironment, shouldDisableLocalTwilio } from '../../src/utils/scripts/runtimeEnvironment.ts';

interface WindowLike {
  location: {
    hostname: string;
    port: string;
  };
  localStorage: {
    getItem: (key: string) => string | null;
  };
}

type GlobalWithWindow = typeof globalThis & {
  window?: WindowLike;
};

const runtimeGlobal = globalThis as GlobalWithWindow;
const originalWindow = runtimeGlobal.window;

function setMockWindow(hostname: string, port: string, disableTwilioFlag: string | null): void {
  runtimeGlobal.window = {
    location: {
      hostname,
      port,
    },
    localStorage: {
      getItem: (key: string) => {
        if (key === 'antl_disable_twilio') {
          return disableTwilioFlag;
        }

        return null;
      },
    },
  };
}

test('isTestEnvironment detecte uniquement localhost sur ports dev', () => {
  setMockWindow('localhost', '5173', null);
  assert.equal(isTestEnvironment(), true);

  setMockWindow('127.0.0.1', '5174', null);
  assert.equal(isTestEnvironment(), true);

  setMockWindow('antl.fr', '', null);
  assert.equal(isTestEnvironment(), false);
});

test('shouldDisableLocalTwilio reste strictement borne au flag local sur localhost', () => {
  setMockWindow('localhost', '5173', '1');
  assert.equal(shouldDisableLocalTwilio(), true);

  setMockWindow('localhost', '5173', null);
  assert.equal(shouldDisableLocalTwilio(), false);

  setMockWindow('app.antl.fr', '', '1');
  assert.equal(shouldDisableLocalTwilio(), false);
});

after(() => {
  runtimeGlobal.window = originalWindow;
});
