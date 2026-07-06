import { mock } from 'node:test';
import assert from 'node:assert/strict';
import test from 'node:test';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

declare global {
  var capturedHistoryEndpoints: string[] | undefined;
}

globalThis.capturedHistoryEndpoints = [];

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/APICalls.ts', {
  namedExports: {
    apiCalls: {
      get: async <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
        globalThis.capturedHistoryEndpoints?.push(endpoint);
        return {
          success: true,
          data: [] as unknown as T,
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          },
        };
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
    },
    extractPaginatedData: <T>(response: ApiResponse<T[]>) => ({
      items: response.data ?? [],
      total: response.pagination?.total ?? 0,
      page: response.pagination?.page ?? 1,
      totalPages: response.pagination?.totalPages ?? 1,
    }),
  }
});

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/utils/scripts/queryString.ts', {
  namedExports: {
    buildQueryString: (params?: Record<string, string | number | boolean | undefined>) => {
      if (!params) {
        return '';
      }

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });

      const query = searchParams.toString();
      return query ? `?${query}` : '';
    },
  }
});

test('AppelService sérialise la campagne pour l historique des appels prospect', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { appelService } = await import('../../src/API/services/Appel.service.ts');

  await appelService.getAppelsByProspect(42, { campagne: 7, page: 2, limit: 20 });

  assert.equal(
    globalThis.capturedHistoryEndpoints?.at(-1),
    '/prospects/42/appels?campagne=7&page=2&limit=20'
  );
});

test('VenteService sérialise la campagne pour l historique des ventes prospect', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { venteService } = await import('../../src/API/services/Vente.service.ts');

  await venteService.getVentesByProspect(42, { campagne: 7 });

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/prospects/42/ventes?campagne=7');
});

test('RendezVousService sérialise la campagne pour l historique rendez-vous prospect', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { rendezVousService } = await import('../../src/API/services/RendezVous.service.ts');

  await rendezVousService.getRendezVousByProspect(42, 7);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/rendez-vous/prospect/42?campagne=7');
});

test('LeadService sérialise la campagne pour l historique rendez-vous client prospect', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { leadService } = await import('../../src/API/services/Lead.service.ts');

  await leadService.getLeadsByProspect(42, 7);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/leads/prospect/42?campagne=7');
});

test('RendezVousService sérialise agent et campagne pour le dashboard du jour', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { rendezVousService } = await import('../../src/API/services/RendezVous.service.ts');

  await rendezVousService.getRendezVousToday(15, 7);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/rendez-vous/today?agent=15&campagne=7');
});
