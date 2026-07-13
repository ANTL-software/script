const CALL_NOTES_DRAFT_PREFIX = 'antl_call_notes_draft';
const CALL_NOTES_DRAFT_CHANGED_EVENT = 'antl_call_notes_draft_changed';

interface CallNotesDraftChangeDetail {
  appelId: number;
  notes: string;
}

function getStorageKey(appelId: number): string {
  return `${CALL_NOTES_DRAFT_PREFIX}_${appelId}`;
}

export class CallNotesDraftService {
  private static instance: CallNotesDraftService;

  private constructor() {}

  public static getInstance(): CallNotesDraftService {
    if (!CallNotesDraftService.instance) {
      CallNotesDraftService.instance = new CallNotesDraftService();
    }

    return CallNotesDraftService.instance;
  }

  public get(appelId: number): string {
    return localStorage.getItem(getStorageKey(appelId)) ?? '';
  }

  public save(appelId: number, notes: string): void {
    localStorage.setItem(getStorageKey(appelId), notes);
    this.dispatchChange({ appelId, notes });
  }

  public clear(appelId: number): void {
    localStorage.removeItem(getStorageKey(appelId));
    this.dispatchChange({ appelId, notes: '' });
  }

  private dispatchChange(detail: CallNotesDraftChangeDetail): void {
    window.dispatchEvent(new CustomEvent<CallNotesDraftChangeDetail>(CALL_NOTES_DRAFT_CHANGED_EVENT, { detail }));
  }
}

export const callNotesDraftService = CallNotesDraftService.getInstance();
export { CALL_NOTES_DRAFT_CHANGED_EVENT };
