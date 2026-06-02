import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart, useProspect, useCampaign, useUser } from './index';
import type { ModePaiement } from '../utils/types';
import { closingService } from '../API/services';
import { validateOrderForm, buildVentePayload } from '../utils/scripts/orderValidation';

interface FormData {
  adresse_facturation: string;
  adresse_livraison: string;
  code_postal_facturation: string;
  code_postal_livraison: string;
  ville_facturation: string;
  ville_livraison: string;
  pays_facturation: string;
  pays_livraison: string;
  meme_adresse: boolean;
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
    adresse_facturation: currentProspect?.adresse_facturation || '',
    adresse_livraison: currentProspect?.adresse_livraison || '',
    code_postal_facturation: currentProspect?.code_postal || '',
    code_postal_livraison: currentProspect?.code_postal || '',
    ville_facturation: currentProspect?.ville || '',
    ville_livraison: currentProspect?.ville || '',
    pays_facturation: currentProspect?.pays || 'France',
    pays_livraison: currentProspect?.pays || 'France',
    meme_adresse: !currentProspect?.adresse_livraison || currentProspect?.adresse_livraison === currentProspect?.adresse_facturation,
    mode_paiement: 'Prelevement',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    const updatedValue = value;

    // Si la checkbox "meme_adresse" est cochée, copier l'adresse de facturation vers l'adresse de livraison
    if (field === 'meme_adresse' && updatedValue === true) {
      setFormData(prev => ({
        ...prev,
        meme_adresse: true,
        adresse_livraison: prev.adresse_facturation,
        code_postal_livraison: prev.code_postal_facturation,
        ville_livraison: prev.ville_facturation,
        pays_livraison: prev.pays_facturation,
      }));
      return;
    }

    // Si la checkbox "meme_adresse" est décochée, effacer l'adresse de livraison
    if (field === 'meme_adresse' && updatedValue === false) {
      setFormData(prev => ({
        ...prev,
        meme_adresse: false,
        adresse_livraison: '',
        code_postal_livraison: '',
        ville_livraison: '',
        pays_livraison: 'France',
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: updatedValue }));

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
