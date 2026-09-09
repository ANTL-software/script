import { useState, useEffect } from 'react';
import { useCampaign, useProspect, useToast } from './index.ts';
import type { AddressSelectionResult, UpdateProspectData } from '../utils/types/index.ts';
import { capitalizeAddress, getProspectRelationBadge } from '../utils/scripts/index.ts';

interface EditableFields {
  nom: string;
  prenom: string;
  raison_sociale: string;
  siret: string;
  code_naf: string;
  activite: string;
  secteur: string;
  region: string;
  civilite: string;
  email: string;
  telephone_contact: string;
  adresse_facturation: string;
  adresse_livraison: string;
  code_postal: string;
  ville: string;
  pays: string;
}

export function useQuiEstCe() {
  const { currentProspect, updateProspect, isLoading } = useProspect();
  const { currentCampaign } = useCampaign();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<EditableFields>({
    nom: '',
    prenom: '',
    raison_sociale: '',
    siret: '',
    code_naf: '',
    activite: '',
    secteur: '',
    region: '',
    civilite: '',
    email: '',
    telephone_contact: '',
    adresse_facturation: '',
    adresse_livraison: '',
    code_postal: '',
    ville: '',
    pays: '',
  });
  const [errors, setErrors] = useState<Partial<EditableFields>>({});

  useEffect(() => {
    if (currentProspect) {
      setEditedFields({
        nom: currentProspect?.nom || '',
        prenom: currentProspect?.prenom || '',
        raison_sociale: currentProspect?.raison_sociale || '',
        siret: currentProspect?.siret || '',
        code_naf: currentProspect?.code_naf || '',
        activite: currentProspect?.activite || '',
        secteur: currentProspect?.secteur || '',
        region: currentProspect?.region || '',
        civilite: currentProspect?.civilite || '',
        email: currentProspect?.email || '',
        telephone_contact: currentProspect?.telephone_contact || '',
        adresse_facturation: currentProspect?.adresse_facturation || '',
        adresse_livraison: currentProspect?.adresse_livraison || '',
        code_postal: currentProspect?.code_postal || '',
        ville: currentProspect?.ville || '',
        pays: currentProspect?.pays || 'France',
      });
    }
  }, [currentProspect]);

  const maturityBadge = getProspectRelationBadge(currentProspect?.relation_commerciale_campagne?.statut_relation);
  const posteOuvert = currentProspect?.poste_ouvert?.trim() ?? '';
  const accroche = currentProspect?.accroche?.trim() ?? '';
  const linkedin = currentProspect?.linkedin?.trim() ?? '';
  const urlOffreEmploi = currentProspect?.url_offre_emploi?.trim() ?? '';
  const angleApproche = currentProspect?.angle_approche?.trim() ?? '';
  const isFgaCampaign = currentCampaign?.id_campagne === 11 || currentProspect?.id_campagne === 11;
  const recruitmentElementCount = [posteOuvert, accroche, linkedin, urlOffreEmploi, angleApproche].filter(Boolean).length;
  const linkedinHref = /^https?:\/\//i.test(linkedin) ? linkedin : null;
  const jobOfferHref = /^https?:\/\//i.test(urlOffreEmploi) ? urlOffreEmploi : null;

  const validateFields = (): boolean => {
    const newErrors: Partial<EditableFields> = {};

    if (editedFields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedFields.email)) {
      newErrors.email = 'Email invalide';
    }

    // Le telephone n'est pas modifiable (ID fiche), donc pas de validation ici
    // if (!editedFields.telephone) { ... }

    if (editedFields.code_postal && !/^[0-9]{5}$/.test(editedFields.code_postal)) {
      newErrors.code_postal = 'Code postal invalide (5 chiffres)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof EditableFields, value: string) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectAdresseFacturation = (result: AddressSelectionResult) => {
    setEditedFields(prev => ({
      ...prev,
      adresse_facturation: result.adresse,
      code_postal: result.code_postal,
      ville: result.ville,
      pays: result.pays,
    }));
    setErrors(prev => ({
      ...prev,
      adresse_facturation: undefined,
      code_postal: undefined,
      ville: undefined,
      pays: undefined,
    }));
  };

  const handleSelectAdresseLivraison = (result: AddressSelectionResult) => {
    setEditedFields(prev => ({
      ...prev,
      adresse_livraison: `${result.adresse}, ${result.code_postal} ${result.ville}`,
    }));
    setErrors(prev => ({
      ...prev,
      adresse_livraison: undefined,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (currentProspect) {
      setEditedFields({
        nom: currentProspect?.nom || '',
        prenom: currentProspect?.prenom || '',
        raison_sociale: currentProspect?.raison_sociale || '',
        siret: currentProspect?.siret || '',
        code_naf: currentProspect?.code_naf || '',
        activite: currentProspect?.activite || '',
        secteur: currentProspect?.secteur || '',
        region: currentProspect?.region || '',
        civilite: currentProspect?.civilite || '',
        email: currentProspect?.email || '',
        telephone_contact: currentProspect?.telephone_contact || '',
        adresse_facturation: currentProspect?.adresse_facturation || '',
        adresse_livraison: currentProspect?.adresse_livraison || '',
        code_postal: currentProspect?.code_postal || '',
        ville: currentProspect?.ville || '',
        pays: currentProspect?.pays || 'France',
      });
    }
  };

  const handleSave = async () => {
    if (!currentProspect || isSaving) return;
    if (!validateFields()) {
      showToast('error', 'Veuillez corriger les erreurs');
      return;
    }

    setIsSaving(true);

    try {
      const dataToUpdate: UpdateProspectData = {};

      // Champs modifiables (seulement ceux qui ont changé)
      if (editedFields.nom.trim() !== (currentProspect?.nom || '').trim()) {
        dataToUpdate.nom = editedFields.nom.trim();
      }
      if (editedFields.prenom.trim() !== (currentProspect?.prenom || '').trim()) {
        dataToUpdate.prenom = editedFields.prenom.trim();
      }
      if (editedFields.raison_sociale.trim() !== (currentProspect?.raison_sociale || '').trim()) {
        dataToUpdate.raison_sociale = editedFields.raison_sociale.trim();
      }
      if (editedFields.siret.trim() !== (currentProspect?.siret || '').trim()) {
        dataToUpdate.siret = editedFields.siret.trim();
      }
      if (editedFields.code_naf.trim() !== (currentProspect?.code_naf || '').trim()) {
        dataToUpdate.code_naf = editedFields.code_naf.trim();
      }
      if (editedFields.activite.trim() !== (currentProspect?.activite || '').trim()) {
        dataToUpdate.activite = editedFields.activite.trim();
      }
      if (editedFields.secteur.trim() !== (currentProspect?.secteur || '').trim()) {
        dataToUpdate.secteur = editedFields.secteur.trim();
      }
      if (editedFields.region.trim() !== (currentProspect?.region || '').trim()) {
        dataToUpdate.region = editedFields.region.trim();
      }
      if (editedFields.civilite.trim() !== (currentProspect?.civilite || '').trim()) {
        dataToUpdate.civilite = editedFields.civilite.trim();
      }
      if (editedFields.email.trim() !== (currentProspect?.email || '').trim()) {
        dataToUpdate.email = editedFields.email.trim();
      }
      if (editedFields.telephone_contact.trim() !== (currentProspect?.telephone_contact || '').trim()) {
        dataToUpdate.telephone_contact = editedFields.telephone_contact.trim();
      }
      if (editedFields.adresse_facturation.trim() !== (currentProspect?.adresse_facturation || '').trim()) {
        dataToUpdate.adresse_facturation = capitalizeAddress(editedFields.adresse_facturation);
      }
      if (editedFields.adresse_livraison.trim() !== (currentProspect?.adresse_livraison || '').trim()) {
        dataToUpdate.adresse_livraison = capitalizeAddress(editedFields.adresse_livraison);
      }
      if (editedFields.code_postal.trim() !== (currentProspect?.code_postal || '').trim()) {
        dataToUpdate.code_postal = editedFields.code_postal.trim();
      }
      if (editedFields.ville.trim() !== (currentProspect?.ville || '').trim()) {
        dataToUpdate.ville = capitalizeAddress(editedFields.ville);
      }
      if (editedFields.pays.trim() !== (currentProspect?.pays || 'France').trim()) {
        dataToUpdate.pays = capitalizeAddress(editedFields.pays);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        showToast('info', 'Aucune modification a enregistrer');
        setIsEditing(false);
        return;
      }

      await updateProspect(dataToUpdate);
      showToast('success', 'Prospect mis a jour avec succes');
      setIsEditing(false);
    } catch {
      showToast('error', 'Erreur lors de la mise a jour');
    } finally {
      setIsSaving(false);
    }
  };

  return { currentProspect, currentCampaign, isLoading, isEditing, isSaving, editedFields, errors, maturityBadge, posteOuvert, accroche, linkedin, urlOffreEmploi, angleApproche, isFgaCampaign, recruitmentElementCount, linkedinHref, jobOfferHref, handleFieldChange, handleSelectAdresseFacturation, handleSelectAdresseLivraison, handleEdit, handleCancel, handleSave };
}
