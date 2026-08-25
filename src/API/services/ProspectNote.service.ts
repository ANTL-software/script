import { apiCalls } from '../APICalls.ts';
import { throwIfApiError } from '../apiHelpers.ts';
import type { ProspectNote } from '../../utils/types/index.ts';
import { FGA_PROSPECT_NOTE_CAMPAIGN_ID } from '../../utils/scripts/index.ts';

export class ProspectNoteService {
  private static instance: ProspectNoteService;

  private constructor() {}

  public static getInstance(): ProspectNoteService {
    if (!ProspectNoteService.instance) {
      ProspectNoteService.instance = new ProspectNoteService();
    }
    return ProspectNoteService.instance;
  }

  public async getActive(prospectId: number): Promise<ProspectNote | null> {
    const response = await apiCalls.get<ProspectNote | null>(
      `/prospect-notes/${prospectId}?campagne=${FGA_PROSPECT_NOTE_CAMPAIGN_ID}`,
    );
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du chargement de la note FGA');
    }
    return response.data ?? null;
  }

  public async save(prospectId: number, contenu: string): Promise<ProspectNote> {
    const response = await apiCalls.put<ProspectNote>(`/prospect-notes/${prospectId}`, {
      id_campagne: FGA_PROSPECT_NOTE_CAMPAIGN_ID,
      contenu,
    });
    return throwIfApiError(response, 'Erreur lors de l’enregistrement de la note FGA');
  }

  public async delete(prospectId: number): Promise<void> {
    const response = await apiCalls.delete<{ deleted: boolean }>(
      `/prospect-notes/${prospectId}?campagne=${FGA_PROSPECT_NOTE_CAMPAIGN_ID}`,
    );
    throwIfApiError(response, 'Erreur lors de la suppression de la note FGA');
  }
}

export const prospectNoteService = ProspectNoteService.getInstance();
