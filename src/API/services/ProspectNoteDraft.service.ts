const PROSPECT_NOTE_DRAFT_PREFIX = 'antl_fga_prospect_note_draft';
const PROSPECT_NOTE_DRAFT_CHANGED_EVENT = 'antl_fga_prospect_note_draft_changed';

export interface ProspectNoteDraftChangeDetail {
  prospectId: number;
  notes: string;
}

function getStorageKey(prospectId: number): string {
  return `${PROSPECT_NOTE_DRAFT_PREFIX}_${prospectId}`;
}

export class ProspectNoteDraftService {
  private static instance: ProspectNoteDraftService;

  private constructor() {}

  public static getInstance(): ProspectNoteDraftService {
    if (!ProspectNoteDraftService.instance) {
      ProspectNoteDraftService.instance = new ProspectNoteDraftService();
    }
    return ProspectNoteDraftService.instance;
  }

  public get(prospectId: number): string {
    return localStorage.getItem(getStorageKey(prospectId)) ?? '';
  }

  public has(prospectId: number): boolean {
    return localStorage.getItem(getStorageKey(prospectId)) !== null;
  }

  public save(prospectId: number, notes: string): void {
    localStorage.setItem(getStorageKey(prospectId), notes);
    this.dispatchChange({ prospectId, notes });
  }

  public clear(prospectId: number): void {
    localStorage.removeItem(getStorageKey(prospectId));
    this.dispatchChange({ prospectId, notes: '' });
  }

  private dispatchChange(detail: ProspectNoteDraftChangeDetail): void {
    window.dispatchEvent(new CustomEvent<ProspectNoteDraftChangeDetail>(
      PROSPECT_NOTE_DRAFT_CHANGED_EVENT,
      { detail },
    ));
  }
}

export const prospectNoteDraftService = ProspectNoteDraftService.getInstance();
export { PROSPECT_NOTE_DRAFT_CHANGED_EVENT };
