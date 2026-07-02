import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProspect, useCampaign, useApp, useCart, useDialer } from './index';
import { closingService, type PendingClosing } from '../API/services';
import { formatProspectName } from '../utils/scripts/formatters';
import { getCampaignUiConfig, getCampaignVariant } from '../utils/scripts/campaignVariants';

export function useLandingPage(id: string | undefined, isTestMode?: boolean) {
  const navigate = useNavigate();
  const { currentProspect, isLoading, error, loadProspect, clearError } = useProspect();
  const { currentCampaign, loadCampaign, loadProduits } = useCampaign();
  const { currentView, setView } = useApp();
  const { clearCart } = useCart();
  const { statut, callDuration, currentCampagneId, currentAppelId, currentOrigineAppel, currentRendezVousSourceId } = useDialer();

  // Log le mode test pour débogage (sera utilisé pour désactiver le dialer si nécessaire)
  if (isTestMode) {
    console.log('[LANDING] Mode test activé - Dialer sera désactivé');
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  const previousProspectIdRef = useRef<number | null>(null);
  const wasCallActiveRef = useRef<boolean>(false);

  // Détecter si un appel a été actif (sortant ou en cours) pendant la visite de cette fiche
  if (statut === 'en_appel' || statut === 'appel_sortant' || statut === 'qualification_en_cours' || statut === 'svi_a_naviguer') {
    wasCallActiveRef.current = true;
  }

  // Réinitialise la vue et le panier à chaque changement de prospect
  useEffect(() => {
    if (!currentProspect) return;
    if (currentProspect.id_prospect === previousProspectIdRef.current) return;

    const isClosing = closingService.hasPending();
    if (!isClosing && previousProspectIdRef.current !== null) {
      clearCart();
      setView('qui-est-ce');
    }
    previousProspectIdRef.current = currentProspect.id_prospect;
    wasCallActiveRef.current = false; // Réinitialiser le marqueur d'appel pour la nouvelle fiche
  }, [currentProspect, clearCart, setView]);

  // Réinitialise la vue et le panier lors de la fermeture/démontage de la fiche prospect
  useEffect(() => {
    return () => {
      setView('qui-est-ce');
      clearCart();
    };
  }, [setView, clearCart]);

  // Charge le prospect et la campagne runtime de l'agent.
  // La campagne active doit venir de la session dialer/affectation, pas de l'URL.
  useEffect(() => {
    const prospectId = id ? parseInt(id, 10) : NaN;
    if (isNaN(prospectId)) {
      navigate('/', { replace: true });
      return;
    }
    loadProspect(prospectId);
    if (currentCampagneId) {
      loadCampaign(currentCampagneId);
    }
  }, [id, loadProspect, loadCampaign, navigate, currentCampagneId]);

  // Déclenche la closing modal dès que l'appel se termine (statut = pause_apres_appel)
  // sans passer par une vente — garantit que chaque appel est enregistré en DB
  useEffect(() => {
    if (statut !== 'pause_apres_appel') return;
    if (!wasCallActiveRef.current) return;
    if (!currentProspect) return;

    // Si un closing a déjà été créé (par exemple suite à une commande validée),
    // on a simplement à réinitialiser le marqueur d'appel.
    if (closingService.hasPending()) {
      wasCallActiveRef.current = false;
      return;
    }

    const campagneId = currentCampagneId ?? currentCampaign?.id_campagne ?? 0;
    if (!campagneId) return;

    const pending: Omit<PendingClosing, 'timestamp'> = {
      prospectId: currentProspect.id_prospect,
      prospectName: formatProspectName({ nom: currentProspect.nom, prenom: currentProspect.prenom }),
      campagneId,
      campaignVariant: getCampaignVariant(currentCampaign),
      appelId: currentAppelId,
      origineAppel: currentOrigineAppel,
      rendezVousSourceId: currentRendezVousSourceId,
      dureeAppel: callDuration,
    };

    closingService.savePending(pending);
    wasCallActiveRef.current = false; // Réinitialiser le marqueur d'appel
  }, [statut, currentProspect, currentCampaign, currentCampagneId, currentAppelId, currentOrigineAppel, currentRendezVousSourceId, callDuration]);

  const handlePlanAppels = () => {
    const campagneId = currentCampaign?.id_campagne ?? currentCampagneId;
    if (!campagneId) return;
    const params = new URLSearchParams({ campagne: String(campagneId) });
    if (isTestMode) {
      params.set('test', 'true');
    }
    window.open(`/plan-appel?${params.toString()}`, 'plan-appel', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleObjections = () => {
    const campagneId = currentCampaign?.id_campagne ?? currentCampagneId;
    if (!campagneId) return;
    const params = new URLSearchParams({ campagne: String(campagneId) });
    if (isTestMode) {
      params.set('test', 'true');
    }
    window.open(`/objections?${params.toString()}`, 'objections', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleCommande = () => {
    setView('commande');
    if (getCampaignUiConfig(currentCampaign).commandeMode === 'sales') {
      loadProduits();
    }
  };

  const handleOrderSuccess = () => {
    // Le closing est sauvegardé globalement lors de la confirmation de la commande.
  };

  return {
    currentProspect,
    currentCampaign,
    currentView,
    isLoading,
    error,
    clearError,
    isModalOpen,
    setIsModalOpen,
    setView,
    handlePlanAppels,
    handleObjections,
    handleCommande,
    handleOrderSuccess,
  };
}
