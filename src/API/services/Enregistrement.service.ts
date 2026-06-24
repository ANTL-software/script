import { apiCalls } from '../APICalls.ts';
import { throwIfApiError } from '../apiHelpers.ts';
import type { EnregistrementAppel } from '../../utils/types';

export class EnregistrementService {
  private static instance: EnregistrementService;

  private constructor() {}

  public static getInstance(): EnregistrementService {
    if (!EnregistrementService.instance) {
      EnregistrementService.instance = new EnregistrementService();
    }
    return EnregistrementService.instance;
  }

  /**
   * Upload un enregistrement audio pour un appel donné
   * @param idAppel ID de l'appel associé
   * @param file Fichier audio (Blob/File)
   * @param dureeSecondes Optionnel, durée de l'enregistrement en secondes
   */
  public async uploadRecording(idAppel: number, file: File, dureeSecondes?: number): Promise<EnregistrementAppel> {
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('id_appel', String(idAppel));
    if (dureeSecondes !== undefined) {
      formData.append('duree_secondes', String(dureeSecondes));
    }

    const response = await apiCalls.post<EnregistrementAppel>('/enregistrements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return throwIfApiError(response, 'Erreur lors de la sauvegarde de l\'enregistrement');
  }
}

export const enregistrementService = EnregistrementService.getInstance();
