import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProspect, useCampaign, useApp, useCart } from './index';
import { closingService, prospectService, type PendingClosing } from '../API/services';

export function useLandingPage(id: string | undefined) {
  const navigate = useNavigate();
  const { currentProspect, isLoading, error, loadProspect, clearError } = useProspect();
  const { currentCampaign, loadCampaign, loadProduits } = useCampaign();
  const { currentView, setView } = useApp();
  const { clearCart } = useCart();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [pendingClosing, setPendingClosing] = useState<PendingClosing | null>(
    () => closingService.getPending()
  );
  const [confirmModal, setConfirmModal] = useState<{ type: 'doublon' | 'optout' | null; isLoading: boolean }>({
    type: null,
    isLoading: false,
  });

  const previousProspectIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentProspect) return;
    if (currentProspect.id_prospect === previousProspectIdRef.current) return;

    const isClosing = closingService.hasPending();
    if (!isClosing && previousProspectIdRef.current !== null) {
      clearCart();
      setView('qui-est-ce');
    }
    previousProspectIdRef.current = currentProspect.id_prospect;
  }, [currentProspect, clearCart, setView]);

  useEffect(() => {
    const prospectId = id ? parseInt(id, 10) : NaN;
    if (isNaN(prospectId)) {
      navigate('/', { replace: true });
      return;
    }
    loadProspect(prospectId);
    loadCampaign(1);
  }, [id, loadProspect, loadCampaign, navigate]);

  const handlePlanAppels = () => {
    const campagneId = currentCampaign?.id_campagne || 1;
    window.open(`/plan-appel?campagne=${campagneId}`, 'plan-appel', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleObjections = () => {
    const campagneId = currentCampaign?.id_campagne || 1;
    window.open(`/objections?campagne=${campagneId}`, 'objections', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleCommande = () => {
    setView('commande');
    loadProduits();
  };

  const handleDoublon = () => setConfirmModal({ type: 'doublon', isLoading: false });
  const handleRss = () => setConfirmModal({ type: 'optout', isLoading: false });

  const handleConfirmAction = async () => {
    if (!currentProspect || !confirmModal.type) return;
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      if (confirmModal.type === 'doublon') {
        await prospectService.markDoublon(currentProspect.id_prospect);
      } else {
        await prospectService.markOptout(currentProspect.id_prospect);
      }
      setConfirmModal({ type: null, isLoading: false });
      navigate('/');
    } catch {
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOrderSuccess = () => {
    const stored = closingService.getPending();
    if (stored) setPendingClosing(stored);
  };

  const handleClosingComplete = () => {
    setPendingClosing(null);
    setShowSuccessMessage(true);
    setView('qui-est-ce');
    setTimeout(() => setShowSuccessMessage(false), 5000);
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
    showSuccessMessage,
    pendingClosing,
    confirmModal,
    setConfirmModal,
    setView,
    handlePlanAppels,
    handleObjections,
    handleCommande,
    handleDoublon,
    handleRss,
    handleConfirmAction,
    handleOrderSuccess,
    handleClosingComplete,
  };
}
