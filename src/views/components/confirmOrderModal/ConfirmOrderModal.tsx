import './confirmOrderModal.scss';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FaTimes, FaCheck, FaSpinner, FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaStickyNote } from 'react-icons/fa';
import { useCart, useProspect, useCampaign, useUser } from '../../../hooks';
import type { ModePaiement } from '../../../utils/types';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/utils';
import { closingService } from '../../../API/services';
import Button from '../button/Button';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  mode_paiement: ModePaiement;
  notes: string;
}

export default function ConfirmOrderModal({ isOpen, onClose, onSuccess }: ConfirmOrderModalProps) {
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

    if (!formData.adresse.trim()) {
      errors.adresse = 'L\'adresse est obligatoire';
    }

    if (!formData.code_postal.trim()) {
      errors.code_postal = 'Le code postal est obligatoire';
    } else if (!/^\d{5}$/.test(formData.code_postal)) {
      errors.code_postal = 'Le code postal doit contenir 5 chiffres';
    }

    if (!formData.ville.trim()) {
      errors.ville = 'La ville est obligatoire';
    }

    if (!formData.pays.trim()) {
      errors.pays = 'Le pays est obligatoire';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
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
      const venteData = {
        id_prospect: currentProspect.id_prospect,
        id_campagne: currentCampaign.id_campagne,
        mode_paiement: formData.mode_paiement,
        details: items.map(item => ({
          id_produit: item.produit.id_produit,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          remise: item.remise,
        })),
      };

      await createVente(venteData);

      // Sauvegarder l'etat de closing obligatoire
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirm-order-modal__overlay" onClick={onClose}>
      <div className="confirm-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-order-modal__header">
          <h2>Finalisation de la commande</h2>
          <button
            type="button"
            className="confirm-order-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="confirm-order-modal__form">
          {error && (
            <div className="confirm-order-modal__error">
              {error}
            </div>
          )}

          <div className="confirm-order-modal__section">
            <h3>
              <FaShoppingCart /> Récapitulatif du panier
            </h3>
            <div className="confirm-order-modal__cart-items">
              {items.map((item) => {
                const sousTotal = calculateLineTotal(item.prix_unitaire, item.quantite, item.remise);
                return (
                  <div key={item.produit.id_produit} className="confirm-order-modal__cart-item">
                    <div className="confirm-order-modal__cart-item-info">
                      <span className="confirm-order-modal__cart-item-name">
                        {item.produit.nom_produit}
                      </span>
                      <span className="confirm-order-modal__cart-item-quantity">
                        x{item.quantite}
                      </span>
                    </div>
                    <div className="confirm-order-modal__cart-item-price">
                      {item.remise > 0 && (
                        <span className="confirm-order-modal__cart-item-remise">
                          -{formatCurrency(item.remise)}
                        </span>
                      )}
                      <span className="confirm-order-modal__cart-item-total">
                        {formatCurrency(sousTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="confirm-order-modal__cart-total">
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <h3>
              <FaMapMarkerAlt /> Informations de livraison
            </h3>
            <div className="confirm-order-modal__form-grid">
              <div className="confirm-order-modal__form-group confirm-order-modal__form-group--full">
                <label htmlFor="adresse">Adresse *</label>
                <input
                  type="text"
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  disabled={isSubmitting}
                  className={validationErrors.adresse ? 'input-error' : ''}
                />
                {validationErrors.adresse && (
                  <span className="error-message">{validationErrors.adresse}</span>
                )}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="code_postal">Code postal *</label>
                <input
                  type="text"
                  id="code_postal"
                  value={formData.code_postal}
                  onChange={(e) => handleInputChange('code_postal', e.target.value)}
                  disabled={isSubmitting}
                  maxLength={5}
                  className={validationErrors.code_postal ? 'input-error' : ''}
                />
                {validationErrors.code_postal && (
                  <span className="error-message">{validationErrors.code_postal}</span>
                )}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="ville">Ville *</label>
                <input
                  type="text"
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => handleInputChange('ville', e.target.value)}
                  disabled={isSubmitting}
                  className={validationErrors.ville ? 'input-error' : ''}
                />
                {validationErrors.ville && (
                  <span className="error-message">{validationErrors.ville}</span>
                )}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="pays">Pays *</label>
                <input
                  type="text"
                  id="pays"
                  value={formData.pays}
                  onChange={(e) => handleInputChange('pays', e.target.value)}
                  disabled={isSubmitting}
                  className={validationErrors.pays ? 'input-error' : ''}
                />
                {validationErrors.pays && (
                  <span className="error-message">{validationErrors.pays}</span>
                )}
              </div>
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <h3>
              <FaCreditCard /> Mode de paiement
            </h3>
            <div className="confirm-order-modal__payment-options">
              {(['Prelevement', 'Cheque', 'Virement'] as ModePaiement[]).map((mode) => (
                <label key={mode} className="confirm-order-modal__payment-option">
                  <input
                    type="radio"
                    name="mode_paiement"
                    value={mode}
                    checked={formData.mode_paiement === mode}
                    onChange={(e) => handleInputChange('mode_paiement', e.target.value as ModePaiement)}
                    disabled={isSubmitting}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <h3>
              <FaStickyNote /> Notes complémentaires
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Ajouter des notes ou commentaires sur cette commande..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="confirm-order-modal__footer">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner" /> Envoi en cours...
                </>
              ) : (
                <>
                  <FaCheck /> Confirmer la commande
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
