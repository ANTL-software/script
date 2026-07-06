import { useState } from 'react';
import type { FormEvent } from 'react';
import { useUser, useToast, useDialer, useProspect } from './index';
import { appelService, closingService, dialerService, leadService, rendezVousService } from '../API/services';
import type { StatutAppel } from '../utils/types';
import type { CampaignVariant } from '../utils/scripts/campaignVariants';
import { CAMPAIGN_VARIANTS } from '../utils/scripts/campaignVariants';
import { getErrorMessage } from '../utils/scripts/formatters';

interface UseCallClosingOptions {
  prospectId: number;
  campagneId: number;
  appelId?: number;
  origineAppel?: 'auto' | 'manuel' | 'rappel';
  rendezVousSourceId?: number;
  campaignVariant?: CampaignVariant | null;
  onComplete: () => void;
  dureeAppel?: number;
}

export function useCallClosing({ prospectId, campagneId, appelId, origineAppel, rendezVousSourceId, campaignVariant = null, onComplete, dureeAppel }: UseCallClosingOptions) {
  const { user } = useUser();
  const { showToast } = useToast();
  const { currentProgpa, resetCurrentProgpa } = useProspect();
  const { currentAppelId, currentIdProspection, callDuration, currentOrigineAppel, currentRendezVousSourceId } = useDialer();

  const [selectedStatut, setSelectedStatut] = useState<StatutAppel | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!selectedStatut) {
      setError("Veuillez selectionner un resultat d'appel");
      return;
    }

    if (!user) {
      setError('Session expiree, veuillez vous reconnecter');
      return;
    }

    const effectiveProgpa = selectedStatut === 'vente_conclue' ? 5 : currentProgpa;

    if (effectiveProgpa === null) {
      setError("Veuillez renseigner l'etape atteinte dans le plan d'appel");
      return;
    }

    setIsSubmitting(true);

    const requiresLeadValidation = selectedStatut === 'rendez_vous_pris' && campaignVariant === CAMPAIGN_VARIANTS.lead_b2b;
    const requiresAgendaValidation = selectedStatut === 'rdv_pris'
      || (selectedStatut === 'rendez_vous_pris' && campaignVariant !== CAMPAIGN_VARIANTS.lead_b2b);

    if (requiresLeadValidation) {
      try {
        const leads = await leadService.getLeadsByProspect(prospectId, campagneId);
        const activeLeads = leads.filter((lead) =>
          (lead.statut === 'planifie' || lead.statut === 'reporte')
          && lead.id_agent === user.id_employe
          && lead.id_campagne === campagneId
        );
        if (activeLeads.length === 0) {
          showToast('warning', 'Veuillez enregistrer une prise de rendez-vous client avant de valider.');
          setError('Planification du rendez-vous client obligatoire pour ce statut.');
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Erreur lors de la validation du rendez-vous client MMA:', err);
        setError('Impossible de vérifier la prise de rendez-vous client.');
        setIsSubmitting(false);
        return;
      }
    }

    if (requiresAgendaValidation) {
      try {
        const rdvs = await rendezVousService.getRendezVousByProspect(prospectId, campagneId);
        const activeRdvs = rdvs.filter(r =>
          (r.statut === 'planifie' || r.statut === 'reporte') &&
          r.id_agent === user.id_employe &&
          r.id_campagne === campagneId
        );
        if (activeRdvs.length === 0) {
          showToast('warning', 'Veuillez planifier un rendez-vous dans le calendrier avant de valider.');
          setError('Planification de rendez-vous obligatoire pour ce statut.');
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("Erreur lors de la validation du rendez-vous agenda:", err);
        setError("Impossible de verifier la planification du rendez-vous.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const resolvedAppelId = currentAppelId ?? appelId ?? null;
      const resolvedOrigineAppel = currentOrigineAppel ?? origineAppel ?? 'manuel';
      const resolvedRendezVousSourceId = currentRendezVousSourceId ?? rendezVousSourceId ?? undefined;

      if (resolvedAppelId) {
        // Appel SIP : terminer l'appel existant avec le statut final
        const finalDuration = dureeAppel ?? callDuration;
        const abouti = ['vente_conclue', 'rdv_pris', 'rendez_vous_pris', 'abouti', 'refus_definitif', 'doublon', 'optout', 'relance'].includes(selectedStatut);
        await appelService.terminerAppel(resolvedAppelId, {
          statut_appel: selectedStatut,
          notes: notes.trim() || undefined,
          abouti,
          duree_secondes: finalDuration > 0 ? finalDuration : undefined,
          id_prospection: currentIdProspection ?? undefined,
          progpa_atteint: effectiveProgpa,
        });
      } else {
        // Mode manuel : créer l'appel directement (pas de session SIP tracée)
        // Le backend crée une session pause_apres_appel (car statut_appel ≠ en_cours)
        await appelService.createAppel({
          id_prospect: prospectId,
          id_campagne: campagneId,
          statut_appel: selectedStatut,
          notes: notes.trim() || undefined,
          origine_appel: resolvedOrigineAppel,
          id_rendez_vous_source: resolvedRendezVousSourceId,
          progpa_atteint: effectiveProgpa,
        });
        // Garde : s'assurer que le backend est bien en pause_apres_appel
        await dialerService.changerStatut('pause_apres_appel');
      }

      closingService.clearPending();
      resetCurrentProgpa();
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
