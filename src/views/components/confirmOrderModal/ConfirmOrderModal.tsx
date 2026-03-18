import './confirmOrderModal.scss';
import { FaTimes, FaCheck, FaSpinner, FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaStickyNote } from 'react-icons/fa';
import type { ModePaiement } from '../../../utils/types';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/utils';
import { useOrderConfirmation } from '../../../hooks/useOrderConfirmation';
import Button from '../button/Button';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmOrderModal({ isOpen, onClose, onSuccess }: ConfirmOrderModalProps) {
  const {
    items, total,
    formData, isSubmitting, error, validationErrors,
    handleInputChange, handleSubmit,
  } = useOrderConfirmation({ onClose, onSuccess });

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
          {error && <div className="confirm-order-modal__error">{error}</div>}

          <div className="confirm-order-modal__section">
            <h3><FaShoppingCart /> Récapitulatif du panier</h3>
            <div className="confirm-order-modal__cart-items">
              {items.map((item) => {
                const sousTotal = calculateLineTotal(item.prix_unitaire, item.quantite, item.remise);
                return (
                  <div key={item.produit.id_produit} className="confirm-order-modal__cart-item">
                    <div className="confirm-order-modal__cart-item-info">
                      <span className="confirm-order-modal__cart-item-name">{item.produit.nom_produit}</span>
                      <span className="confirm-order-modal__cart-item-quantity">x{item.quantite}</span>
                    </div>
                    <div className="confirm-order-modal__cart-item-price">
                      {item.remise > 0 && (
                        <span className="confirm-order-modal__cart-item-remise">-{formatCurrency(item.remise)}</span>
                      )}
                      <span className="confirm-order-modal__cart-item-total">{formatCurrency(sousTotal)}</span>
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
            <h3><FaMapMarkerAlt /> Informations de livraison</h3>
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
                {validationErrors.adresse && <span className="error-message">{validationErrors.adresse}</span>}
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
                {validationErrors.code_postal && <span className="error-message">{validationErrors.code_postal}</span>}
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
                {validationErrors.ville && <span className="error-message">{validationErrors.ville}</span>}
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
                {validationErrors.pays && <span className="error-message">{validationErrors.pays}</span>}
              </div>
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <h3><FaCreditCard /> Mode de paiement</h3>
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
            <h3><FaStickyNote /> Notes complémentaires</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Ajouter des notes ou commentaires sur cette commande..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="confirm-order-modal__footer">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><FaSpinner className="spinner" /> Envoi en cours...</>
              ) : (
                <><FaCheck /> Confirmer la commande</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
