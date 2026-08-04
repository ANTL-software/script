import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useProspect, useCampaign, useApp, useCart, useDialer, useToast } from './index';
import { closingService, type PendingClosing } from '../API/services';
import { prospectService } from '../API/services/index.ts';
import { formatProspectName } from '../utils/scripts/formatters';
import {
  type ActionButtonId,
  getCampaignUiConfig,
  getCampaignVariant,
} from '../utils/scripts/campaignVariants';
import { resolveRuntimeCampaignId } from '../utils/scripts/runtimeCampaign';

export function useLandingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentProspect,
    fullName: prospectFullName,
    isLoading,
    error,
    loadProspect,
    clearError,
  } = useProspect();
  const { currentCampaign, loadCampaign, loadProduits } = useCampaign();
  const { currentView, setView } = useApp();
  const { clearCart } = useCart();
  const { statut, callDuration, currentCampagneId, currentAppelId, currentOrigineAppel, currentRendezVousSourceId } = useDialer();
  const { showToast, confirm } = useToast();
  const isTestMode = searchParams.get('test') === 'true';
  const campaignUi = getCampaignUiConfig(currentCampaign);

  // Log le mode test pour débogage (sera utilisé pour désactiver le dialer si nécessaire)
  if (isTestMode) {
    console.log('[LANDING] Mode test activé - Dialer sera désactivé');
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  const previousProspectIdRef = useRef<number | null>(null);
  const wasCallActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (['en_appel', 'appel_sortant', 'qualification_en_cours', 'svi_a_naviguer'].includes(statut)) {
      wasCallActiveRef.current = true;
    }
  }, [statut]);

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

  // Charge le prospect
  useEffect(() => {
    const prospectId = id ? parseInt(id, 10) : NaN;
    if (isNaN(prospectId)) {
      navigate('/', { replace: true });
      return;
    }
    loadProspect(prospectId);
  }, [id, loadProspect, navigate]);

  // Charger la campagne à partir du dialer ou de la fiche prospect
  useEffect(() => {
    const campaignIdToLoad = isTestMode
      ? currentCampagneId
      : resolveRuntimeCampaignId({
        currentCampaignId: currentProspect?.id_campagne ?? null,
        currentDialerCampaignId: currentCampagneId,
        urlCampaignId: null,
      });

    if (campaignIdToLoad) {
      loadCampaign(campaignIdToLoad).catch(() => {});
    }
  }, [currentCampagneId, currentProspect?.id_campagne, isTestMode, loadCampaign]);

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

  useEffect(() => {
    if (
      searchParams.get('test') === 'closing'
      && currentProspect
      && currentCampaign
      && !closingService.hasPending()
    ) {
      closingService.savePending({
        prospectId: currentProspect.id_prospect,
        prospectName: `${currentProspect.nom} ${currentProspect.prenom || ''}`.trim(),
        campagneId: currentCampaign.id_campagne,
        campaignVariant: getCampaignUiConfig(currentCampaign).variant,
        dureeAppel: 45,
      });
      console.log('[DEBUG] Closing modal test activé via URL');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentCampaign, currentProspect, searchParams]);

  useEffect(() => {
    const isAutoReminder = searchParams.get('autoReminder') === '1';
    const isRappelSource = searchParams.get('source') === 'rappel';

    if (!isAutoReminder || !isRappelSource || !currentProspect) return;

    showToast('info', 'Rappel rendez-vous');
    setView('historique-appels');

    const nextParams = new URLSearchParams({ source: 'rappel' });
    const rdvId = searchParams.get('rdvId');
    if (rdvId) nextParams.set('rdvId', rdvId);
    window.history.replaceState({}, '', `${window.location.pathname}?${nextParams.toString()}`);
  }, [currentProspect, searchParams, setView, showToast]);

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

  const sendCatalogue = async (): Promise<void> => {
    if (!currentProspect) {
      showToast('error', 'Aucun prospect chargé');
      return;
    }

    if (!currentProspect.email) {
      showToast('warning', "Le prospect n'a pas d'adresse email renseignee");
      return;
    }

    try {
      const result = await prospectService.sendCatalogue(currentProspect.id_prospect);
      await loadProspect(currentProspect.id_prospect);
      showToast('success', `Catalogue envoyé à ${result.recipientEmail}`);
    } catch (sendError) {
      showToast(
        'error',
        sendError instanceof Error ? sendError.message : "Erreur lors de l'envoi du catalogue",
      );
    }
  };

  const sendPlaquette = async (): Promise<void> => {
    if (!currentProspect) {
      showToast('error', 'Aucun prospect chargé');
      return;
    }

    if (!currentProspect.email) {
      showToast('warning', "Le prospect n'a pas d'adresse email renseignee");
      return;
    }

    try {
      const result = await prospectService.sendPlaquette(currentProspect.id_prospect);
      showToast('success', `Plaquette envoyée à ${result.recipientEmail}`);
    } catch (sendError) {
      showToast(
        'error',
        sendError instanceof Error ? sendError.message : "Erreur lors de l'envoi de la plaquette",
      );
    }
  };

  const handlePlaquetteClick = async (): Promise<void> => {
    const recipientEmail = currentProspect?.email?.trim();
    const confirmed = await confirm({
      title: 'Envoi de la plaquette',
      message: recipientEmail
        ? `Êtes-vous sûr de vouloir envoyer la plaquette par mail à ${recipientEmail} ?`
        : 'Êtes-vous sûr de vouloir envoyer la plaquette par mail ?',
      type: 'info',
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
    });

    if (confirmed) await sendPlaquette();
  };

  const handleTarifsClick = async (): Promise<void> => {
    const recipientEmail = currentProspect?.email?.trim();
    const confirmed = await confirm({
      title: 'Envoi du catalogue',
      message: recipientEmail
        ? `Êtes-vous sûr de vouloir envoyer le catalogue par mail à ${recipientEmail} ?`
        : 'Êtes-vous sûr de vouloir envoyer le catalogue par mail ?',
      type: 'info',
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
    });

    if (confirmed) await sendCatalogue();
  };

  const handleAgrementClick = async (): Promise<void> => {
    const recipientEmail = currentProspect?.email?.trim();
    const confirmed = await confirm({
      title: "Envoi de l'agrément",
      message: recipientEmail
        ? `Êtes-vous sûr de vouloir envoyer l'agrément par mail à ${recipientEmail} ?`
        : "Êtes-vous sûr de vouloir envoyer l'agrément par mail ?",
      type: 'info',
      confirmText: 'Envoyer',
      cancelText: 'Annuler',
    });

    if (confirmed) {
      showToast('warning', "Aucun document d'agrément n'est encore configuré pour cet envoi");
    }
  };

  const handleAction = (actionId: ActionButtonId): void => {
    switch (actionId) {
      case 'plaquette':
        void handlePlaquetteClick();
        break;
      case 'tarifs':
        void handleTarifsClick();
        break;
      case 'agrement':
        void handleAgrementClick();
        break;
      case 'historique-appels':
        setView('historique-appels');
        break;
      case 'historique-offres':
        setView(campaignUi.actions.find((action) => action.id === 'historique-offres')?.targetView ?? 'historique-offres');
        break;
      case 'rendez-vous':
        setView('rendez-vous');
        break;
      case 'commande':
        handleCommande();
        break;
    }
  };

  return {
    currentProspect,
    prospectFullName,
    currentCampaign,
    campaignUi,
    isTestMode,
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
    handleAction,
  };
}
