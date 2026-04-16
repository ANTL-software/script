import { useState } from 'react';
import type { FormEvent } from 'react';
import { useUser, useToast, useDialer } from './index';
import { appelService, closingService } from '../API/services';
import type { StatutAppel } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';

interface UseCallClosingOptions {
  prospectId: number;
  campagneId: number;
  onComplete: () => void;
  dureeAppel?: number;
}

export function useCallClosing({ prospectId, campagneId, onComplete, dureeAppel }: UseCallClosingOptions) {
  const { user } = useUser();
  const { showToast } = useToast();
  const { currentAppelId, currentIdProspection, callDuration } = useDialer();

  const [selectedStatut, setSelectedStatut] = useState<StatutAppel | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedStatut) {
      setError("Veuillez selectionner un resultat d'appel");
      return;
    }

    if (!user) {
      setError('Session expiree, veuillez vous reconnecter');
      return;
    }

    setIsSubmitting(true);

    try {
      if (currentAppelId) {
        // Appel SIP : terminer l'appel existant avec le statut final
        const finalDuration = dureeAppel ?? callDuration;
        const abouti = ['vente_conclue', 'rdv_pris', 'abouti', 'refus_definitif'].includes(selectedStatut);
        await appelService.terminerAppel(currentAppelId, {
          statut_appel: selectedStatut,
          notes: notes.trim() || undefined,
          abouti,
          duree_secondes: finalDuration > 0 ? finalDuration : undefined,
          id_prospection: currentIdProspection ?? undefined,
        });
      } else {
        // Mode manuel : créer l'appel directement (pas de session SIP tracée)
        await appelService.createAppel({
          id_prospect: prospectId,
          id_campagne: campagneId,
          statut_appel: selectedStatut,
          notes: notes.trim() || undefined,
        });
      }

      closingService.clearPending();
      showToast('success', "Resultat d'appel enregistre");
      onComplete();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError(getErrorMessage(err, "Erreur lors de l'enregistrement"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedStatut,
    setSelectedStatut,
    notes,
    setNotes,
    isSubmitting,
    error,
    handleSubmit,
  };
}
