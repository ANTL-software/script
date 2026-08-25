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
  var capturedTelephonyStatePayload: unknown;
  var capturedProspectNotePayload: unknown;
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
      },
      post: async <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
        globalThis.capturedHistoryEndpoints?.push(endpoint);
        return {
          success: true,
          data: { recipientEmail: 'prospect@example.com' } as T,
        };
      },
      patch: async <T = unknown>(endpoint: string, payload: unknown): Promise<ApiResponse<T>> => {
        globalThis.capturedHistoryEndpoints?.push(endpoint);
        globalThis.capturedTelephonyStatePayload = payload;
        return {
          success: true,
          data: { id_appel: 42 } as T,
        };
      },
      put: async <T = unknown>(endpoint: string, payload: unknown): Promise<ApiResponse<T>> => {
        globalThis.capturedHistoryEndpoints?.push(endpoint);
        globalThis.capturedProspectNotePayload = payload;
        return {
          success: true,
          data: {
            id_note_prospect: 3,
            id_prospect: 42,
            id_campagne: 11,
            id_agent: 5,
            id_appel: null,
            contenu: 'Preparation FGA',
            created_at: '2026-08-25T08:00:00.000Z',
            updated_at: '2026-08-25T08:00:00.000Z',
          } as T,
        };
      },
      delete: async <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
        globalThis.capturedHistoryEndpoints?.push(endpoint);
        return {
          success: true,
          data: { deleted: true } as T,
        };
      },
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

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/models/index.ts', {
  namedExports: {
    ProspectModel: class ProspectModelStub {
      static fromJSON<T>(data: T): T {
        return data;
      }
    },
  },
});

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/utils/scripts/index.ts', {
  namedExports: {
    FGA_PROSPECT_NOTE_CAMPAIGN_ID: 11,
    buildQueryString: (params?: Record<string, string | number | boolean | undefined>) => {
      if (!params) return '';
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
      const query = searchParams.toString();
      return query ? `?${query}` : '';
    },
  },
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

test('AppelService synchronise le cycle technique Asterisk sans clôturer le statut métier', async () => {
  globalThis.capturedHistoryEndpoints = [];
  globalThis.capturedTelephonyStatePayload = undefined;
  const { appelService } = await import('../../src/API/services/Appel.service.ts');
  const payload = {
    state: 'answered' as const,
    provider_call_id: 'ast_12345678',
  };

  await appelService.updateTelephonyState(42, payload);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/appels/42/telephony-state');
  assert.deepEqual(globalThis.capturedTelephonyStatePayload, payload);
  assert.equal('statut_appel' in payload, false);
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

test('ProspectService conserve le endpoint catalogue et le destinataire retourné par le backend', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { prospectService } = await import('../../src/API/services/Prospect.service.ts');

  const result = await prospectService.sendCatalogue(42);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/prospects/42/send-catalogue');
  assert.deepEqual(result, { recipientEmail: 'prospect@example.com' });
});

test('ProspectService utilise le endpoint plaquette et conserve le destinataire retourné par le backend', async () => {
  globalThis.capturedHistoryEndpoints = [];
  const { prospectService } = await import('../../src/API/services/Prospect.service.ts');

  const result = await prospectService.sendPlaquette(42);

  assert.equal(globalThis.capturedHistoryEndpoints?.at(-1), '/prospects/42/send-plaquette');
  assert.deepEqual(result, { recipientEmail: 'prospect@example.com' });
});

test('ProspectNoteService force le scope FGA sur lecture, ecriture et suppression', async () => {
  globalThis.capturedHistoryEndpoints = [];
  globalThis.capturedProspectNotePayload = undefined;
  const { prospectNoteService } = await import('../../src/API/services/ProspectNote.service.ts');

  await prospectNoteService.getActive(42);
  await prospectNoteService.save(42, 'Preparation FGA');
  await prospectNoteService.delete(42);

  assert.deepEqual(globalThis.capturedHistoryEndpoints, [
    '/prospect-notes/42?campagne=11',
    '/prospect-notes/42',
    '/prospect-notes/42?campagne=11',
  ]);
  assert.deepEqual(globalThis.capturedProspectNotePayload, {
    id_campagne: 11,
    contenu: 'Preparation FGA',
  });
});
