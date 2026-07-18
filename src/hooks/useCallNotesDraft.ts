import { useCallback, useEffect, useState } from 'react';
import { CALL_NOTES_DRAFT_CHANGED_EVENT, callNotesDraftService } from '../API/services';
import { clearCallNotesDraft, updateCallNotesDraft } from '../utils/scripts';

interface CallNotesDraftChangeDetail {
  appelId: number;
  notes: string;
}

export function useCallNotesDraft(appelId: number | null | undefined) {
  const [notes, setNotesState] = useState<string>(() => (
    appelId ? callNotesDraftService.get(appelId) : ''
  ));

  useEffect(() => {
    queueMicrotask(() => setNotesState(appelId ? callNotesDraftService.get(appelId) : ''));
  }, [appelId]);

  useEffect(() => {
    const handleDraftChange = (event: Event): void => {
      const customEvent = event as CustomEvent<CallNotesDraftChangeDetail>;
      if (appelId && customEvent.detail.appelId === appelId) {
        setNotesState(customEvent.detail.notes);
      }
    };

    window.addEventListener(CALL_NOTES_DRAFT_CHANGED_EVENT, handleDraftChange);
    return () => window.removeEventListener(CALL_NOTES_DRAFT_CHANGED_EVENT, handleDraftChange);
  }, [appelId]);

  const setNotes = useCallback((nextNotes: string): void => {
    updateCallNotesDraft(
      appelId,
      nextNotes,
      setNotesState,
      (id, value) => callNotesDraftService.save(id, value),
    );
  }, [appelId]);

  const clearNotes = useCallback((): void => {
    clearCallNotesDraft(
      appelId,
      setNotesState,
      (id) => callNotesDraftService.clear(id),
    );
  }, [appelId]);

  return { notes, setNotes, clearNotes };
}
