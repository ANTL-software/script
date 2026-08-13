import { useState, useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useCart, useProspect, useCampaign, useUser, useDialer } from './index';
import type { ModePaiement, DelaisLivraison } from '../utils/types/index.ts';
import { closingService } from '../API/services/index.ts';
import { buildVentePayload, getCampaignVariant, validateOrderForm } from '../utils/scripts/index.ts';

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
  mode_paiement: ModePaiement | '';
  notes: string;
  siret: string;
  email: string;
  raison_sociale: string;
  delais_livraison: DelaisLivraison;
  civilite: string;
  nom_contact: string;
  plage_horaire_livraison: string;
  livraison_offerte: boolean;
}

interface UseOrderConfirmationOptions {
  onClose: () => void;
  onSuccess: () => void;
}

export function useOrderConfirmation({ onClose, onSuccess }: UseOrderConfirmationOptions) {
  const { items, total, clearCart } = useCart();
  const { currentProspect, createVente, updateProspect } = useProspect();
  const { currentCampaign } = useCampaign();
  const { user } = useUser();
  const {
    currentAppelId,
    currentAppelProspectId,
    currentOrigineAppel,
    currentRendezVousSourceId,
    callDuration,
  } = useDialer();

  const availableModesPaiement = useMemo<ModePaiement[]>(
    () => currentCampaign
      ? (currentCampaign.modes_paiement ?? [])
      : ['Prelevement', 'Cheque', 'Virement'],
    [currentCampaign],
  );

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
    mode_paiement: availableModesPaiement[0] || '',
    notes: '',
    siret: currentProspect?.siret || '',
    email: currentProspect?.email || '',
    raison_sociale: currentProspect?.raison_sociale || '',
    delais_livraison: 2,
    civilite: currentProspect?.civilite || '',
    nom_contact: `${currentProspect?.prenom || ''} ${currentProspect?.nom || ''}`.trim(),
    plage_horaire_livraison: '',
    livraison_offerte: false,
  });

  // Met à jour le formData quand le prospect change
  useEffect(() => {
    if (currentProspect) {
      setFormData(prev => ({
        ...prev,
        adresse_facturation: currentProspect.adresse_facturation || '',
        adresse_livraison: currentProspect.adresse_livraison || '',
        code_postal_facturation: currentProspect.code_postal || '',
        code_postal_livraison: currentProspect.code_postal || '',
        ville_facturation: currentProspect.ville || '',
        ville_livraison: currentProspect.ville || '',
        pays_facturation: currentProspect.pays || 'France',
        pays_livraison: currentProspect.pays || 'France',
        siret: currentProspect.siret || '',
        email: currentProspect.email || '',
        raison_sociale: currentProspect.raison_sociale || '',
        civilite: prev.civilite || currentProspect.civilite || '',
        nom_contact: prev.nom_contact || `${currentProspect.prenom || ''} ${currentProspect.nom || ''}`.trim(),
      }));
    }
  }, [currentProspect]);

  useEffect(() => {
    setFormData((prev) => {
      if (prev.mode_paiement && availableModesPaiement.includes(prev.mode_paiement)) {
        return prev;
      }

      return {
        ...prev,
        mode_paiement: availableModesPaiement[0] || '',
      };
    });
  }, [availableModesPaiement]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string | boolean | number) => {
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

    setFormData(prev => {
      const next = { ...prev, [field]: updatedValue };
      // Si on modifie un champ de facturation et que meme_adresse est coché, copier vers livraison
      if (prev.meme_adresse) {
        if (field === 'adresse_facturation') next.adresse_livraison = updatedValue as string;
        if (field === 'code_postal_facturation') next.code_postal_livraison = updatedValue as string;
        if (field === 'ville_facturation') next.ville_livraison = updatedValue as string;
        if (field === 'pays_facturation') next.pays_livraison = updatedValue as string;
      }
      return next;
    });

    if (validationErrors[field as string]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleProspectInfoUpdate = async (updatedFields: Partial<typeof formData>) => {
    if (!currentProspect) return;

    const prospectUpdates: {
      siret?: string;
      email?: string;
      raison_sociale?: string;
      adresse_facturation?: string;
      adresse_livraison?: string;
      code_postal?: string;
      ville?: string;
      pays?: string;
      civilite?: string;
      nom?: string;
      prenom?: string;
    } = {};

    // Mapper les champs du form vers les champs du prospect
    if (updatedFields.siret !== undefined) prospectUpdates.siret = updatedFields.siret.trim();
    if (updatedFields.email !== undefined) prospectUpdates.email = updatedFields.email.trim();
    if (updatedFields.raison_sociale !== undefined) prospectUpdates.raison_sociale = updatedFields.raison_sociale.trim();
    if (updatedFields.adresse_facturation !== undefined) prospectUpdates.adresse_facturation = updatedFields.adresse_facturation.trim();
    if (updatedFields.adresse_livraison !== undefined) prospectUpdates.adresse_livraison = updatedFields.adresse_livraison.trim();
    if (updatedFields.code_postal_facturation !== undefined) prospectUpdates.code_postal = updatedFields.code_postal_facturation.trim();
    if (updatedFields.ville_facturation !== undefined) prospectUpdates.ville = updatedFields.ville_facturation.trim();
    if (updatedFields.pays_facturation !== undefined) prospectUpdates.pays = updatedFields.pays_facturation.trim();
    if (updatedFields.civilite !== undefined) prospectUpdates.civilite = updatedFields.civilite.trim();
    if (updatedFields.nom_contact !== undefined) {
      const nameParts = updatedFields.nom_contact.trim().split(/\s+/);
      const prenom = nameParts.length > 1 ? nameParts[0] : '';
      const nom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
      prospectUpdates.nom = nom;
      prospectUpdates.prenom = prenom;
    }

    // Ne mettre à jour que si il y a des changements
    const hasChanges = Object.keys(prospectUpdates).length > 0;
    if (!hasChanges) return;

    try {
      await updateProspect(prospectUpdates);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du prospect:', err);
      // Ne pas bloquer le formulaire, juste logger l'erreur
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

    if (!formData.mode_paiement) {
      setError('Aucun mode de paiement n’est autorisé pour cette campagne');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mettre à jour les infos du prospect avec les champs SAISIS (siret, email, raison_sociale, adresses)
      await handleProspectInfoUpdate(formData);

      const appelId = currentAppelProspectId === currentProspect.id_prospect
        ? currentAppelId ?? undefined
        : undefined;

      const venteData = buildVentePayload({
        prospectId: currentProspect.id_prospect,
        campagneId: currentCampaign.id_campagne,
        appelId,
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
        campaignVariant: getCampaignVariant(currentCampaign),
        appelId,
        origineAppel: currentOrigineAppel ?? undefined,
        rendezVousSourceId: currentRendezVousSourceId ?? undefined,
        dureeAppel: callDuration,
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
    availableModesPaiement,
    formData,
    isSubmitting,
    error,
    validationErrors,
    handleInputChange,
    handleSubmit,
    handleProspectInfoUpdate,
  };
}
