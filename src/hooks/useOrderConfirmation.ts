import { useState } from 'react';
import type { FormEvent } from 'react';
import { useCart, useProspect, useCampaign, useUser } from './index';
import type { ModePaiement } from '../utils/types';
import { closingService } from '../API/services';

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.adresse.trim()) errors.adresse = "L'adresse est obligatoire";
    if (!formData.code_postal.trim()) {
      errors.code_postal = 'Le code postal est obligatoire';
    } else if (!/^\d{5}$/.test(formData.code_postal)) {
      errors.code_postal = 'Le code postal doit contenir 5 chiffres';
    }
    if (!formData.ville.trim()) errors.ville = 'La ville est obligatoire';
    if (!formData.pays.trim()) errors.pays = 'Le pays est obligatoire';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    if (!validateForm()) return;

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
      const venteData = {
        id_prospect: currentProspect.id_prospect,
        id_campagne: currentCampaign.id_campagne,
        mode_paiement: formData.mode_paiement,
        notes: formData.notes.trim() || undefined,
        details: items.map(item => ({
          id_produit: item.produit.id_produit,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          remise: item.remise,
        })),
      };

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
