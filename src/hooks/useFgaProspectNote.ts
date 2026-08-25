import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PROSPECT_NOTE_DRAFT_CHANGED_EVENT,
  prospectNoteDraftService,
  prospectNoteService,
} from '../API/services/index.ts';
import type { ProspectNoteDraftChangeDetail } from '../API/services/index.ts';
import { supportsStandaloneProspectNotes } from '../utils/scripts/index.ts';

export function useFgaProspectNote(
  prospectId: number | null | undefined,
  campaignId: number | null | undefined,
) {
  const isEnabled = prospectId != null && supportsStandaloneProspectNotes(campaignId);
  const [notes, setNotesState] = useState<string>(() => (
    isEnabled ? prospectNoteDraftService.get(prospectId) : ''
  ));
  const [persistedNotes, setPersistedNotes] = useState('');
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!isEnabled) {
      queueMicrotask(() => {
        if (active) {
          setNotesState('');
          setPersistedNotes('');
          setIsLoading(false);
          setError(null);
        }
      });
      return () => {
        active = false;
      };
    }

    const activeProspectId = prospectId;
    queueMicrotask(() => {
      if (active) {
        setNotesState(prospectNoteDraftService.get(activeProspectId));
        setPersistedNotes('');
        setIsLoading(true);
        setIsSaving(false);
        setError(null);
      }
    });
    prospectNoteService.getActive(activeProspectId)
      .then((note) => {
        if (!active) return;
        const remoteNotes = note?.contenu ?? '';
        const localNotes = prospectNoteDraftService.get(activeProspectId);
        const hasLocalDraft = prospectNoteDraftService.has(activeProspectId);
        setPersistedNotes(remoteNotes);
        if (hasLocalDraft) {
          setNotesState(localNotes);
        } else {
          setNotesState(remoteNotes);
          if (remoteNotes) {
            prospectNoteDraftService.save(activeProspectId, remoteNotes);
          }
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Erreur lors du chargement de la note FGA');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isEnabled, prospectId]);

  useEffect(() => {
    if (!isEnabled) return undefined;

    const handleDraftChange = (event: Event): void => {
      const customEvent = event as CustomEvent<ProspectNoteDraftChangeDetail>;
      if (customEvent.detail.prospectId === prospectId) {
        setNotesState(customEvent.detail.notes);
      }
    };

    window.addEventListener(PROSPECT_NOTE_DRAFT_CHANGED_EVENT, handleDraftChange);
    return () => window.removeEventListener(PROSPECT_NOTE_DRAFT_CHANGED_EVENT, handleDraftChange);
  }, [isEnabled, prospectId]);

  const setNotes = useCallback((nextNotes: string): void => {
    if (!isEnabled) return;
    setNotesState(nextNotes);
    prospectNoteDraftService.save(prospectId, nextNotes);
    setError(null);
  }, [isEnabled, prospectId]);

  const saveNotes = useCallback(async (): Promise<void> => {
    if (!isEnabled) return;
    setIsSaving(true);
    setError(null);
    try {
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        const savedNote = await prospectNoteService.save(prospectId, trimmedNotes);
        setPersistedNotes(savedNote.contenu);
        setNotesState(savedNote.contenu);
        prospectNoteDraftService.save(prospectId, savedNote.contenu);
      } else {
        await prospectNoteService.delete(prospectId);
        setPersistedNotes('');
        prospectNoteDraftService.clear(prospectId);
      }
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Erreur lors de l’enregistrement de la note FGA');
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }, [isEnabled, notes, prospectId]);

  const clearLocalNotes = useCallback((): void => {
    if (!isEnabled) return;
    setNotesState('');
    setPersistedNotes('');
    prospectNoteDraftService.clear(prospectId);
  }, [isEnabled, prospectId]);

  const isDirty = useMemo(
    () => notes.trim() !== persistedNotes.trim(),
    [notes, persistedNotes],
  );

  return {
    notes,
    setNotes,
    saveNotes,
    clearLocalNotes,
    isLoading,
    isSaving,
    isDirty,
    error,
  };
}
