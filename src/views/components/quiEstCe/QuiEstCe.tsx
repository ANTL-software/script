import './quiEstCe.scss';
import { useState, useEffect } from 'react';
import { useProspect } from '../../../hooks/useProspect';
import { useToast } from '../../../hooks/useToast';
import Button from '../button/Button';
import Input from '../input/Input';
import { FaSave, FaEdit, FaTimes } from 'react-icons/fa';
import type { UpdateProspectData } from '../../../utils/types';

interface EditableFields {
  email: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

export default function QuiEstCe() {
  const { currentProspect, updateProspect, isLoading } = useProspect();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<EditableFields>({
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
  });
  const [errors, setErrors] = useState<Partial<EditableFields>>({});

  useEffect(() => {
    if (currentProspect) {
      setEditedFields({
        email: currentProspect.email || '',
        telephone: currentProspect.telephone || '',
        adresse: currentProspect.adresse || '',
        code_postal: currentProspect.code_postal || '',
        ville: currentProspect.ville || '',
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

  const validateFields = (): boolean => {
    const newErrors: Partial<EditableFields> = {};

    if (editedFields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedFields.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!editedFields.telephone) {
      newErrors.telephone = 'Telephone requis';
    } else if (!/^[0-9+\s\-().]{6,20}$/.test(editedFields.telephone)) {
      newErrors.telephone = 'Format telephone invalide';
    }

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
        email: currentProspect.email || '',
        telephone: currentProspect.telephone || '',
        adresse: currentProspect.adresse || '',
        code_postal: currentProspect.code_postal || '',
        ville: currentProspect.ville || '',
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

      if (editedFields.email !== (currentProspect.email || '')) {
        dataToUpdate.email = editedFields.email || undefined;
      }
      if (editedFields.telephone !== currentProspect.telephone) {
        dataToUpdate.telephone = editedFields.telephone;
      }
      if (editedFields.adresse !== (currentProspect.adresse || '')) {
        dataToUpdate.adresse = editedFields.adresse || undefined;
      }
      if (editedFields.code_postal !== (currentProspect.code_postal || '')) {
        dataToUpdate.code_postal = editedFields.code_postal || undefined;
      }
      if (editedFields.ville !== (currentProspect.ville || '')) {
        dataToUpdate.ville = editedFields.ville || undefined;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="qui-est-ce">
      <div className="qui-est-ce__header">
        <h2>Qui est-ce ?</h2>
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
              <span className="qui-est-ce__value qui-est-ce__value--statut" data-statut={currentProspect.statut}>
                {currentProspect.statut.replace('_', ' ')}
              </span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Nom</span>
              <span className="qui-est-ce__value">{currentProspect.nom}</span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Prenom</span>
              <span className="qui-est-ce__value">{currentProspect.prenom || '-'}</span>
            </div>
            {currentProspect.type_prospect === 'Entreprise' && (
              <div className="qui-est-ce__field qui-est-ce__field--full">
                <span className="qui-est-ce__label">Raison sociale</span>
                <span className="qui-est-ce__value">{currentProspect.raison_sociale || '-'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="qui-est-ce__section">
          <h3>Contact</h3>
          <div className="qui-est-ce__grid">
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Telephone</span>
              {isEditing ? (
                <Input
                  value={editedFields.telephone}
                  onChange={(e) => handleFieldChange('telephone', e.target.value)}
                  error={errors.telephone}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.telephone}</span>
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
              <span className="qui-est-ce__label">Adresse</span>
              {isEditing ? (
                <Input
                  value={editedFields.adresse}
                  onChange={(e) => handleFieldChange('adresse', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.adresse || '-'}</span>
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
              <span className="qui-est-ce__value">{currentProspect.pays || 'France'}</span>
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
            <span>Cree le {formatDate(currentProspect.created_at)}</span>
            <span>Modifie le {formatDate(currentProspect.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
