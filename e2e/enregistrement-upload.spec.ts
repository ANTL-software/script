import { expect, test } from '@playwright/test';

interface CapturedUploadRequest {
  method: string;
  contentType: string;
  postData: string;
}

interface UploadResult {
  id_enregistrement: number;
  id_appel: number;
  id_agent: number;
  nom_fichier: string;
  taille_octets: number;
  mime_type: string;
}

test('uploadRecording envoie un FormData multipart au backend', async ({ page }) => {
  let capturedUpload: CapturedUploadRequest | null = null;

  await page.route('**/api/**', async (route) => {
    const request = route.request();

    if (request.url().endsWith('/api/csrf-token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          csrfToken: 'playwright-csrf-token',
          headerName: 'x-csrf-token',
        }),
      });
      return;
    }

    if (request.url().endsWith('/api/enregistrements')) {
      capturedUpload = {
        method: request.method(),
        contentType: request.headers()['content-type'] || '',
        postData: request.postData() || '',
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id_enregistrement: 77,
            id_appel: 42,
            id_agent: 5,
            nom_fichier: 'appel.webm',
            taille_octets: 2048,
            mime_type: 'audio/webm',
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.goto('/');

  const result = await page.evaluate(async (): Promise<UploadResult> => {
    const modulePath = '/src/API/services/Enregistrement.service.ts';
    const { enregistrementService } = await import(modulePath);
    const file = new File(['audio-data-audio-data'], 'appel.webm', { type: 'audio/webm' });

    return await enregistrementService.uploadRecording(42, file, 12);
  });

  expect(result.id_enregistrement).toBe(77);
  expect(capturedUpload?.method).toBe('POST');
  expect(capturedUpload?.contentType).toContain('multipart/form-data');
  expect(capturedUpload?.postData).toContain('name="id_appel"');
  expect(capturedUpload?.postData).toContain('42');
  expect(capturedUpload?.postData).toContain('name="duree_secondes"');
  expect(capturedUpload?.postData).toContain('12');
  expect(capturedUpload?.postData).toContain('name="recording"');
});
