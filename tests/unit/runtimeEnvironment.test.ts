import assert from 'node:assert/strict';
import test, { after } from 'node:test';

import {
  isTestEnvironment,
  shouldDisableLocalTwilio,
  getApiBaseUrl,
  getProductionApiBaseUrl,
  getSessionMarkerName,
  getTestApiBaseUrl,
} from '../../src/utils/scripts/runtimeEnvironment.ts';
import type { RuntimeEnvironmentVariables } from '../../src/utils/scripts/runtimeEnvironment.ts';

interface WindowLike {
  location: {
    hostname: string;
    port: string;
    search?: string;
  };
  localStorage: {
    getItem: (key: string) => string | null;
  };
}

type GlobalWithWindow = typeof globalThis & {
  window?: WindowLike;
  _mockEnv?: RuntimeEnvironmentVariables;
};

const runtimeGlobal = globalThis as GlobalWithWindow;
const originalWindow = runtimeGlobal.window;
const originalMockEnv = runtimeGlobal._mockEnv;

function setMockWindow(hostname: string, port: string, disableTwilioFlag: string | null, search: string = ''): void {
  runtimeGlobal.window = {
    location: {
      hostname,
      port,
      search,
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

function setMockEnv(prodUrl: string | undefined, testUrl: string | undefined): void {
  runtimeGlobal._mockEnv = {
    VITE_API_BASE_URL: prodUrl,
    VITE_API_TEST_BASE_URL: testUrl,
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

test('shouldDisableLocalTwilio désactive Twilio pour toute fiche de formation', () => {
  setMockWindow('localhost', '5173', '1');
  assert.equal(shouldDisableLocalTwilio(), true);

  setMockWindow('localhost', '5173', null);
  assert.equal(shouldDisableLocalTwilio(), false);

  setMockWindow('app.antl.fr', '', '1');
  assert.equal(shouldDisableLocalTwilio(), false);

  setMockWindow('script.antl.fr', '', null, '?test=true');
  assert.equal(shouldDisableLocalTwilio(), true);
});

test('getApiBaseUrl gère correctement les environnements et fallbacks', () => {
  // 1. En environnement de test local (localhost:5173)
  setMockWindow('localhost', '5173', null);
  
  // Par défaut sans config
  setMockEnv(undefined, undefined);
  assert.equal(getApiBaseUrl(), 'http://localhost:8800/api');

  // Avec config de test locale
  setMockEnv('http://localhost:8800/api', 'http://localhost:8800/api');
  assert.equal(getApiBaseUrl(), 'http://localhost:8800/api');

  // Même si la prod est configurée, en local on reste sur localhost par défaut
  setMockEnv('https://api.antl.fr/api', undefined);
  assert.equal(getApiBaseUrl(), 'http://localhost:8800/api');

  // L'accès via 127.0.0.1 conserve ce hostname pour les cookies SameSite locaux
  setMockWindow('127.0.0.1', '5174', null);
  setMockEnv('http://localhost:8800/api', 'http://localhost:8800/api');
  assert.equal(getApiBaseUrl(), 'http://127.0.0.1:8800/api');

  // 2. En production normale (hostname non dev)
  setMockWindow('script.antl.fr', '', null);

  // Si pas de config ou localhost configuré par erreur dans .env
  setMockEnv('http://localhost:8800/api', 'http://localhost:8800/api');
  assert.equal(getApiBaseUrl(), 'https://api.antl.fr/api');

  // Si URL de prod valide configurée
  setMockEnv('https://custom-api.antl.fr/api', 'http://localhost:8800/api');
  assert.equal(getApiBaseUrl(), 'https://custom-api.antl.fr/api');

  // 3. En production avec mode test (ex: ?test=true)
  setMockWindow('script.antl.fr', '', null, '?test=true');

  // Si test URL configurée est localhost ou absente
  setMockEnv('https://api.antl.fr/api', 'http://localhost:8800/api');
  assert.equal(getApiBaseUrl(), 'https://api-test.antl.fr/api');

  setMockEnv('https://api.antl.fr/api', undefined);
  assert.equal(getApiBaseUrl(), 'https://api-test.antl.fr/api');

  // Si test URL valide spécifique configurée
  setMockEnv('https://api.antl.fr/api', 'https://custom-test.antl.fr/api');
  assert.equal(getApiBaseUrl(), 'https://custom-test.antl.fr/api');
  assert.equal(getProductionApiBaseUrl(), 'https://api.antl.fr/api');
  assert.equal(getTestApiBaseUrl(), 'https://custom-test.antl.fr/api');

  // Restauration
  runtimeGlobal._mockEnv = originalMockEnv;
});

test('getSessionMarkerName conserve le marqueur local et isole celui de test en production', () => {
  setMockWindow('localhost', '5174', null, '?test=true');
  assert.equal(getSessionMarkerName(), 'session_active');

  setMockWindow('script.antl.fr', '', null, '?test=true');
  assert.equal(getSessionMarkerName(), 'session_active_test');

  setMockWindow('script.antl.fr', '', null);
  assert.equal(getSessionMarkerName(), 'session_active');
});

after(() => {
  runtimeGlobal.window = originalWindow;
  runtimeGlobal._mockEnv = originalMockEnv;
});
