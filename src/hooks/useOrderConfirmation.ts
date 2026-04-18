import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart, useProspect, useCampaign, useUser } from './index';
import type { ModePaiement } from '../utils/types';
import { closingService } from '../API/services';
import { validateOrderForm, buildVentePayload } from '../utils/scripts/orderValidation';

interface FormData {
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  mode_paiement: ModePaiement;
  notes: string;
}

interface UseOrderConfirmationOptions {
  onClose: () => void;
  onSuccess: () => void;
}

export function useOrderConfirmation({ onClose, onSuccess }: UseOrderConfirmationOptions) {
  const { items, total, clearCart } = useCart();
  const { currentProspect, createVente } = useProspect();
  const { currentCampaign } = useCampaign();
  const { user } = useUser();

  const [formData, setFormData] = useState<FormData>({
    adresse: currentProspect?.adresse || '',
    code_postal: currentProspect?.code_postal || '',
    ville: currentProspect?.ville || '',
    pays: currentProspect?.pays || 'France',
    mode_paiement: 'Prelevement',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors = validateOrderForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!currentProspect || !currentCampaign || !user) {
      setError('Informations manquantes (prospect, campagne ou utilisateur)');
      return;
    }

    if (items.length === 0) {
      setError('Le panier est vide');
      return;
    }

    setIsSubmitting(true);

    try {
      const venteData = buildVentePayload({
        prospectId: currentProspect.id_prospect,
        campagneId: currentCampaign.id_campagne,
        formData,
        items,
      });

      await createVente(venteData);

      const prospectName = currentProspect.prenom
        ? `${currentProspect.prenom} ${currentProspect.nom}`
        : currentProspect.nom;

      closingService.savePending({
        prospectId: currentProspect.id_prospect,
        prospectName,
        campagneId: currentCampaign.id_campagne,
      });

      clearCart();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création de la vente:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    total,
    formData,
    isSubmitting,
    error,
    validationErrors,
    handleInputChange,
    handleSubmit,
  };
}
