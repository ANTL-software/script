import { mock } from 'node:test';
import assert from 'node:assert/strict';
import test from 'node:test';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

declare global {
  var capturedStatsEndpoint: string | undefined;
}

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/APICalls.ts', {
  namedExports: {
    apiCalls: {
      get: async <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
        globalThis.capturedStatsEndpoint = endpoint;
        return { success: true, data: {} as T };
      }
    }
  }
});

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/apiHelpers.ts', {
  namedExports: {
    throwIfApiError: <T>(response: ApiResponse<T>): T => {
      if (response.success === false) {
        throw new Error(response.message || 'API Error');
      }
      return response.data as T;
    }
  }
});

test('StatsService sérialise le filtre campagne quand la campagne runtime est connue', async () => {
  const { statsService } = await import('../../src/API/services/Stats.service.ts');

  await statsService.getMyStatsDuJour(7);

  assert.equal(globalThis.capturedStatsEndpoint, '/employes/me/stats?campagne=7');
});

test('StatsService conserve le endpoint historique sans filtre campagne', async () => {
  const { statsService } = await import('../../src/API/services/Stats.service.ts');

  await statsService.getMyStatsDuJour();

  assert.equal(globalThis.capturedStatsEndpoint, '/employes/me/stats');
});
