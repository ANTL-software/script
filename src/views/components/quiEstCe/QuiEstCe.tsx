import './quiEstCe.scss';
import { useState, useEffect } from 'react';
import { useCampaign, useProspect, useToast } from '../../../hooks/index.ts';
import { Button } from '../button/index.ts';
import { Input } from '../input/index.ts';
import { ProgPAReadonly } from '../progPA/index.ts';
import { FaSave, FaEdit, FaTimes } from 'react-icons/fa';
import type { UpdateProspectData } from '../../../utils/types/index.ts';
import {
  formatDateLong,
  getCampaignVariant,
  getProspectRelationBadge,
  getStatutProspectLabel,
} from '../../../utils/scripts/index.ts';

interface EditableFields {
  nom: string;
  prenom: string;
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

export default function QuiEstCe() {
  const { currentProspect, updateProspect, isLoading } = useProspect();
  const { currentCampaign } = useCampaign();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<EditableFields>({
    nom: '',
    prenom: '',
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
        nom: currentProspect.nom || '',
        prenom: currentProspect.prenom || '',
        siret: currentProspect.siret || '',
        code_naf: currentProspect.code_naf || '',
        activite: currentProspect.activite || '',
        secteur: currentProspect.secteur || '',
        region: currentProspect.region || '',
        civilite: currentProspect.civilite || '',
        email: currentProspect.email || '',
        telephone_contact: currentProspect.telephone_contact || '',
        adresse_facturation: currentProspect.adresse_facturation || '',
        adresse_livraison: currentProspect.adresse_livraison || '',
        code_postal: currentProspect.code_postal || '',
        ville: currentProspect.ville || '',
        pays: currentProspect.pays || 'France',
      });
    }
  }, [currentProspect]);

  if (!currentProspect) {
    return (
      <div className="qui-est-ce">
        <div className="qui-est-ce__empty">
          <p>Aucun prospect selectionne</p>
        </div>
      </div>
    );
  }

  const maturityBadge = getProspectRelationBadge(currentProspect.relation_commerciale_campagne?.statut_relation);

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (currentProspect) {
      setEditedFields({
        nom: currentProspect.nom || '',
        prenom: currentProspect.prenom || '',
        siret: currentProspect.siret || '',
        code_naf: currentProspect.code_naf || '',
        activite: currentProspect.activite || '',
        secteur: currentProspect.secteur || '',
        region: currentProspect.region || '',
        civilite: currentProspect.civilite || '',
        email: currentProspect.email || '',
        telephone_contact: currentProspect.telephone_contact || '',
        adresse_facturation: currentProspect.adresse_facturation || '',
        adresse_livraison: currentProspect.adresse_livraison || '',
        code_postal: currentProspect.code_postal || '',
        ville: currentProspect.ville || '',
        pays: currentProspect.pays || 'France',
      });
    }
  };

  const handleSave = async () => {
    if (!validateFields()) {
      showToast('error', 'Veuillez corriger les erreurs');
      return;
    }

    setIsSaving(true);

    try {
      const dataToUpdate: UpdateProspectData = {};

      // Champs modifiables (seulement ceux qui ont changé)
      if (editedFields.nom !== (currentProspect.nom || '')) {
        dataToUpdate.nom = editedFields.nom || undefined;
      }
      if (editedFields.prenom !== (currentProspect.prenom || '')) {
        dataToUpdate.prenom = editedFields.prenom || undefined;
      }
      if (editedFields.siret !== (currentProspect.siret || '')) {
        dataToUpdate.siret = editedFields.siret || undefined;
      }
      if (editedFields.code_naf !== (currentProspect.code_naf || '')) {
        dataToUpdate.code_naf = editedFields.code_naf || undefined;
      }
      if (editedFields.activite !== (currentProspect.activite || '')) {
        dataToUpdate.activite = editedFields.activite || undefined;
      }
      if (editedFields.secteur !== (currentProspect.secteur || '')) {
        dataToUpdate.secteur = editedFields.secteur || undefined;
      }
      if (editedFields.region !== (currentProspect.region || '')) {
        dataToUpdate.region = editedFields.region || undefined;
      }
      if (editedFields.civilite !== (currentProspect.civilite || '')) {
        dataToUpdate.civilite = editedFields.civilite || undefined;
      }
      if (editedFields.email !== (currentProspect.email || '')) {
        dataToUpdate.email = editedFields.email || undefined;
      }
      if (editedFields.telephone_contact !== (currentProspect.telephone_contact || '')) {
        dataToUpdate.telephone_contact = editedFields.telephone_contact || undefined;
      }
      if (editedFields.adresse_facturation !== (currentProspect.adresse_facturation || '')) {
        dataToUpdate.adresse_facturation = editedFields.adresse_facturation || undefined;
      }
      if (editedFields.adresse_livraison !== (currentProspect.adresse_livraison || '')) {
        dataToUpdate.adresse_livraison = editedFields.adresse_livraison || undefined;
      }
      if (editedFields.code_postal !== (currentProspect.code_postal || '')) {
        dataToUpdate.code_postal = editedFields.code_postal || undefined;
      }
      if (editedFields.ville !== (currentProspect.ville || '')) {
        dataToUpdate.ville = editedFields.ville || undefined;
      }
      if (editedFields.pays !== (currentProspect.pays || 'France')) {
        dataToUpdate.pays = editedFields.pays || undefined;
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

  return (
    <div className="qui-est-ce">
      <div className="qui-est-ce__header">
        <div className="qui-est-ce__heading">
          <h2>Qui est-ce ?</h2>
          <span
            className="qui-est-ce__maturity-badge"
            data-relation={maturityBadge.variant}
          >
            {maturityBadge.label}
          </span>
        </div>
        <ProgPAReadonly
          value={currentProspect.max_progpa_campagne}
          campaignVariant={getCampaignVariant(currentCampaign)}
          commercialFollowup={currentProspect.suivi_commercial_en_cours}
        />
        <div className="qui-est-ce__actions">
          {!isEditing ? (
            <Button variant="primary" size="small" onClick={handleEdit}>
              <FaEdit /> Modifier
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="small" onClick={handleCancel} disabled={isSaving}>
                <FaTimes /> Annuler
              </Button>
              <Button variant="primary" size="small" onClick={handleSave} isLoading={isSaving}>
                <FaSave /> Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="qui-est-ce__content">
        <div className="qui-est-ce__section">
          <h3>Informations generales</h3>
          <div className="qui-est-ce__grid">
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Type</span>
              <span className="qui-est-ce__value">{currentProspect.type_prospect}</span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Statut</span>
              <span
                className="qui-est-ce__value qui-est-ce__value--statut"
                data-statut={currentProspect.statut_campagne ?? currentProspect.statut}
              >
                {getStatutProspectLabel(currentProspect.statut_campagne ?? currentProspect.statut)}
              </span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Nom</span>
              {isEditing ? (
                <Input
                  value={editedFields.nom}
                  onChange={(e) => handleFieldChange('nom', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.nom}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Prenom</span>
              {isEditing ? (
                <Input
                  value={editedFields.prenom}
                  onChange={(e) => handleFieldChange('prenom', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.prenom || '-'}</span>
              )}
            </div>
            {currentProspect.type_prospect === 'Entreprise' && (
              <div className="qui-est-ce__field qui-est-ce__field--full">
                <span className="qui-est-ce__label">Raison sociale</span>
                <span className="qui-est-ce__value">{currentProspect.raison_sociale || '-'}</span>
              </div>
            )}
          </div>
        </div>

        {currentProspect.type_prospect === 'Entreprise' && (
          <div className="qui-est-ce__section">
            <h3>Informations entreprise</h3>
            <div className="qui-est-ce__grid">
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">SIRET</span>
                {isEditing ? (
                  <Input
                    value={editedFields.siret}
                    onChange={(e) => handleFieldChange('siret', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.siret || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Code NAF</span>
                {isEditing ? (
                  <Input
                    value={editedFields.code_naf}
                    onChange={(e) => handleFieldChange('code_naf', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.code_naf || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field qui-est-ce__field--full">
                <span className="qui-est-ce__label">Activite</span>
                {isEditing ? (
                  <Input
                    value={editedFields.activite}
                    onChange={(e) => handleFieldChange('activite', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.activite || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Secteur</span>
                {isEditing ? (
                  <Input
                    value={editedFields.secteur}
                    onChange={(e) => handleFieldChange('secteur', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.secteur || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Region</span>
                {isEditing ? (
                  <Input
                    value={editedFields.region}
                    onChange={(e) => handleFieldChange('region', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.region || '-'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="qui-est-ce__section">
          <h3>Contact</h3>
          <div className="qui-est-ce__grid">
            {isEditing ? (
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Civilite</span>
                <Input
                  value={editedFields.civilite}
                  onChange={(e) => handleFieldChange('civilite', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
            ) : (
              currentProspect.civilite && (
                <div className="qui-est-ce__field">
                  <span className="qui-est-ce__label">Civilite</span>
                  <span className="qui-est-ce__value">{currentProspect.civilite}</span>
                </div>
              )
            )}
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Telephone</span>
              <span className="qui-est-ce__value">{currentProspect.telephone}</span>
              <span className="qui-est-ce__hint">(Non modifiable - ID fiche)</span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Tel. contact</span>
              {isEditing ? (
                <Input
                  value={editedFields.telephone_contact}
                  onChange={(e) => handleFieldChange('telephone_contact', e.target.value)}
                  disabled={isLoading || isSaving}
                  placeholder="Ligne directe / portable"
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.telephone_contact || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedFields.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  error={errors.email}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.email || '-'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="qui-est-ce__section">
          <h3>Adresse</h3>
          <div className="qui-est-ce__grid">
            <div className="qui-est-ce__field qui-est-ce__field--full">
              <span className="qui-est-ce__label">Adresse facturation</span>
              {isEditing ? (
                <Input
                  value={editedFields.adresse_facturation}
                  onChange={(e) => handleFieldChange('adresse_facturation', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.adresse_facturation || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field qui-est-ce__field--full">
              <span className="qui-est-ce__label">Adresse livraison</span>
              {isEditing ? (
                <Input
                  value={editedFields.adresse_livraison}
                  onChange={(e) => handleFieldChange('adresse_livraison', e.target.value)}
                  disabled={isLoading || isSaving}
                  placeholder="Adresse de livraison (si differente de l''adresse de facturation)"
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.adresse_livraison || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Code postal</span>
              {isEditing ? (
                <Input
                  value={editedFields.code_postal}
                  onChange={(e) => handleFieldChange('code_postal', e.target.value)}
                  error={errors.code_postal}
                  disabled={isLoading || isSaving}
                  maxLength={5}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.code_postal || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Ville</span>
              {isEditing ? (
                <Input
                  value={editedFields.ville}
                  onChange={(e) => handleFieldChange('ville', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.ville || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Pays</span>
              {isEditing ? (
                <Input
                  value={editedFields.pays}
                  onChange={(e) => handleFieldChange('pays', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.pays || 'France'}</span>
              )}
            </div>
          </div>
        </div>

        {currentProspect.notes && (
          <div className="qui-est-ce__section">
            <h3>Notes</h3>
            <div className="qui-est-ce__notes">
              <p>{currentProspect.notes}</p>
            </div>
          </div>
        )}

        <div className="qui-est-ce__section qui-est-ce__section--meta">
          <div className="qui-est-ce__meta">
            <span>Cree le {formatDateLong(currentProspect.created_at)}</span>
            <span>Modifie le {formatDateLong(currentProspect.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
