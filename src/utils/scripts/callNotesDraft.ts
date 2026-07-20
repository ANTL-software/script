type SetCallNotesDraftState = (notes: string) => void;
type PersistCallNotesDraft = (appelId: number, notes: string) => void;
type ClearPersistedCallNotesDraft = (appelId: number) => void;

export function updateCallNotesDraft(
  appelId: number | null | undefined,
  nextNotes: string,
  setNotesState: SetCallNotesDraftState,
  persistNotes: PersistCallNotesDraft,
): void {
  setNotesState(nextNotes);

  if (!appelId) return;
  persistNotes(appelId, nextNotes);
}

export function clearCallNotesDraft(
  appelId: number | null | undefined,
  setNotesState: SetCallNotesDraftState,
  clearPersistedNotes: ClearPersistedCallNotesDraft,
): void {
  setNotesState('');

  if (!appelId) return;
  clearPersistedNotes(appelId);
}
