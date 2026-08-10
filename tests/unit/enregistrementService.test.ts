import { mock } from 'node:test';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface RequestConfig {
  headers?: Record<string, string>;
}

interface CapturedPost {
  endpoint: string;
  data?: unknown;
  config?: RequestConfig;
}

interface CapturedGet {
  endpoint: string;
}

interface RecordingResponse {
  id_enregistrement: number;
}

declare global {
  var capturedGet: CapturedGet | undefined;
  var capturedPost: CapturedPost | undefined;
}

// Mock the imported APICalls and apiHelpers modules using their absolute URLs with extensions
mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/APICalls.ts', {
  namedExports: {
    apiCalls: {
      get: async <T = unknown>(endpoint: string): Promise<ApiResponse<T>> => {
        globalThis.capturedGet = { endpoint };
        return { success: true, data: { enabled: false } as T };
      },
      post: async <T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> => {
        globalThis.capturedPost = { endpoint, data, config };
        return { success: true, data: { id_enregistrement: 123 } as T };
      }
    }
  }
});

mock.module('file:///Users/ndecr_/working_directory--local/antl/script/src/API/apiHelpers.ts', {
  namedExports: {
    throwIfApiError: <T>(response: ApiResponse<T>): T => {
      if (response && response.success === false) {
        throw new Error(response.message || 'API Error');
      }
      return response.data as T;
    },
    extractPaginatedData: <T>(response: ApiResponse<T>): T | undefined => {
      return response.data;
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

test('EnregistrementService.getConfiguration reads the server kill switch', async () => {
  const { enregistrementService } = await import('../../src/API/services/Enregistrement.service.ts');

  const configuration = await enregistrementService.getConfiguration();

  assert.deepEqual(configuration, { enabled: false });
  assert.equal(globalThis.capturedGet?.endpoint, '/enregistrements/configuration');
});

test('EnregistrementService.uploadRecording builds FormData and posts to endpoint', async () => {
  // Dynamically import the service to ensure mocks are registered before resolution
  const { enregistrementService } = await import('../../src/API/services/Enregistrement.service.ts');

  const mockFile = new File(['audio_mock_data'], 'test_call.webm', { type: 'audio/webm' });
  const result: RecordingResponse = await enregistrementService.uploadRecording(42, mockFile, 30);

  assert.ok(result);
  assert.equal(result.id_enregistrement, 123);

  const captured = globalThis.capturedPost;
  assert.ok(captured);
  assert.equal(captured.endpoint, '/enregistrements');
  assert.ok(captured.data instanceof FormData);
  assert.equal(captured.data.get('id_appel'), '42');
  assert.equal(captured.data.get('duree_secondes'), '30');
  assert.equal(captured.data.get('recording'), mockFile);
  assert.equal(captured.config?.headers?.['Content-Type'], 'multipart/form-data');
});
