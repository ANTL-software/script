import './confirmOrderModal.scss';
import { FaTimes, FaCheck, FaSpinner, FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaStickyNote, FaBuilding, FaClock } from 'react-icons/fa';
import type { ModePaiement } from '../../../utils/types';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/utils';
import { useOrderConfirmation } from '../../../hooks/useOrderConfirmation';
import Button from '../button/Button';
import Select from 'react-select';

const delaisOptions = [
  { value: 2, label: '2 semaines' },
  { value: 4, label: '4 semaines' },
];

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
    handleProspectInfoUpdate,
  } = useOrderConfirmation({ onClose, onSuccess });

  if (!isOpen) return null;

  const handleBlur = async (field: keyof typeof formData) => {
    // Mettre à jour le prospect quand on quitte un champ d'info prospect
    if (['siret', 'email', 'raison_sociale', 'adresse_facturation', 'code_postal_facturation', 'ville_facturation', 'pays_facturation'].includes(field)) {
      await handleProspectInfoUpdate({ [field]: formData[field] });
    }
    // Pour l'adresse de livraison, si meme_adresse est coché, on met à jour avec l'adresse de facturation
    if (field === 'adresse_facturation' && formData.meme_adresse) {
      await handleProspectInfoUpdate({
        adresse_livraison: formData.adresse_facturation,
        code_postal_livraison: formData.code_postal_facturation,
        ville_livraison: formData.ville_facturation,
        pays_livraison: formData.pays_facturation,
      });
    }
  };

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
            <h3><FaBuilding /> Informations du prospect</h3>
            <div className="confirm-order-modal__form-grid">
              <div className="confirm-order-modal__form-group">
                <label htmlFor="raison_sociale">Raison sociale</label>
                <input
                  type="text"
                  id="raison_sociale"
                  value={formData.raison_sociale}
                  onChange={(e) => handleInputChange('raison_sociale', e.target.value)}
                  onBlur={() => handleBlur('raison_sociale')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="siret">SIRET</label>
                <input
                  type="text"
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleInputChange('siret', e.target.value)}
                  onBlur={() => handleBlur('siret')}
                  disabled={isSubmitting}
                  maxLength={14}
                />
              </div>

              <div className="confirm-order-modal__form-group confirm-order-modal__form-group--full">
                <label htmlFor="email">Mail</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="confirm-order-modal__form-group confirm-order-modal__form-group--full">
                <label htmlFor="delais_livraison"><FaClock /> Délai de livraison</label>
                <Select
                  id="delais_livraison"
                  value={delaisOptions.find(opt => opt.value === formData.delais_livraison)}
                  onChange={(selected) => selected && handleInputChange('delais_livraison', selected.value)}
                  options={delaisOptions}
                  isDisabled={isSubmitting}
                  className="confirm-order-modal__select"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <h3><FaMapMarkerAlt /> Adresse de facturation</h3>
            <div className="confirm-order-modal__form-grid">
              <div className="confirm-order-modal__form-group confirm-order-modal__form-group--full">
                <label htmlFor="adresse_facturation">Adresse *</label>
                <input
                  type="text"
                  id="adresse_facturation"
                  value={formData.adresse_facturation}
                  onChange={(e) => handleInputChange('adresse_facturation', e.target.value)}
                  onBlur={() => handleBlur('adresse_facturation')}
                  disabled={isSubmitting}
                  className={validationErrors.adresse_facturation ? 'input-error' : ''}
                />
                {validationErrors.adresse_facturation && <span className="error-message">{validationErrors.adresse_facturation}</span>}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="code_postal_facturation">Code postal *</label>
                <input
                  type="text"
                  id="code_postal_facturation"
                  value={formData.code_postal_facturation}
                  onChange={(e) => handleInputChange('code_postal_facturation', e.target.value)}
                  onBlur={() => handleBlur('code_postal_facturation')}
                  disabled={isSubmitting}
                  maxLength={5}
                  className={validationErrors.code_postal_facturation ? 'input-error' : ''}
                />
                {validationErrors.code_postal_facturation && <span className="error-message">{validationErrors.code_postal_facturation}</span>}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="ville_facturation">Ville *</label>
                <input
                  type="text"
                  id="ville_facturation"
                  value={formData.ville_facturation}
                  onChange={(e) => handleInputChange('ville_facturation', e.target.value)}
                  onBlur={() => handleBlur('ville_facturation')}
                  disabled={isSubmitting}
                  className={validationErrors.ville_facturation ? 'input-error' : ''}
                />
                {validationErrors.ville_facturation && <span className="error-message">{validationErrors.ville_facturation}</span>}
              </div>

              <div className="confirm-order-modal__form-group">
                <label htmlFor="pays_facturation">Pays *</label>
                <input
                  type="text"
                  id="pays_facturation"
                  value={formData.pays_facturation}
                  onChange={(e) => handleInputChange('pays_facturation', e.target.value)}
                  onBlur={() => handleBlur('pays_facturation')}
                  disabled={isSubmitting}
                  className={validationErrors.pays_facturation ? 'input-error' : ''}
                />
                {validationErrors.pays_facturation && <span className="error-message">{validationErrors.pays_facturation}</span>}
              </div>
            </div>
          </div>

          <div className="confirm-order-modal__section">
            <div className="confirm-order-modal__checkbox-group">
              <input
                type="checkbox"
                id="meme_adresse"
                checked={formData.meme_adresse}
                onChange={(e) => handleInputChange('meme_adresse', e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="meme_adresse">L'adresse de livraison est la même que l'adresse de facturation</label>
            </div>

            <h3><FaMapMarkerAlt /> Adresse de livraison</h3>
            <div className={`confirm-order-modal__delivery-section ${formData.meme_adresse ? 'confirm-order-modal__delivery-section--disabled' : ''}`}>
              <div className="confirm-order-modal__form-grid">
                <div className="confirm-order-modal__form-group confirm-order-modal__form-group--full">
                  <label htmlFor="adresse_livraison">Adresse {formData.meme_adresse ? '(identique)' : '*'}</label>
                  <input
                    type="text"
                    id="adresse_livraison"
                    value={formData.meme_adresse ? formData.adresse_facturation : formData.adresse_livraison}
                    onChange={(e) => handleInputChange('adresse_livraison', e.target.value)}
                    onBlur={() => !formData.meme_adresse && handleBlur('adresse_livraison')}
                    disabled={isSubmitting || formData.meme_adresse}
                    className={validationErrors.adresse_livraison && !formData.meme_adresse ? 'input-error' : ''}
                  />
                  {validationErrors.adresse_livraison && !formData.meme_adresse && <span className="error-message">{validationErrors.adresse_livraison}</span>}
                </div>

                <div className="confirm-order-modal__form-group">
                  <label htmlFor="code_postal_livraison">Code postal {formData.meme_adresse ? '(identique)' : '*'}</label>
                  <input
                    type="text"
                    id="code_postal_livraison"
                    value={formData.meme_adresse ? formData.code_postal_facturation : formData.code_postal_livraison}
                    onChange={(e) => handleInputChange('code_postal_livraison', e.target.value)}
                    onBlur={() => !formData.meme_adresse && handleBlur('code_postal_livraison')}
                    disabled={isSubmitting || formData.meme_adresse}
                    maxLength={5}
                    className={validationErrors.code_postal_livraison && !formData.meme_adresse ? 'input-error' : ''}
                  />
                  {validationErrors.code_postal_livraison && !formData.meme_adresse && <span className="error-message">{validationErrors.code_postal_livraison}</span>}
                </div>

                <div className="confirm-order-modal__form-group">
                  <label htmlFor="ville_livraison">Ville {formData.meme_adresse ? '(identique)' : '*'}</label>
                  <input
                    type="text"
                    id="ville_livraison"
                    value={formData.meme_adresse ? formData.ville_facturation : formData.ville_livraison}
                    onChange={(e) => handleInputChange('ville_livraison', e.target.value)}
                    onBlur={() => !formData.meme_adresse && handleBlur('ville_livraison')}
                    disabled={isSubmitting || formData.meme_adresse}
                    className={validationErrors.ville_livraison && !formData.meme_adresse ? 'input-error' : ''}
                  />
                  {validationErrors.ville_livraison && !formData.meme_adresse && <span className="error-message">{validationErrors.ville_livraison}</span>}
                </div>

                <div className="confirm-order-modal__form-group">
                  <label htmlFor="pays_livraison">Pays {formData.meme_adresse ? '(identique)' : '*'}</label>
                  <input
                    type="text"
                    id="pays_livraison"
                    value={formData.meme_adresse ? formData.pays_facturation : formData.pays_livraison}
                    onChange={(e) => handleInputChange('pays_livraison', e.target.value)}
                    onBlur={() => !formData.meme_adresse && handleBlur('pays_livraison')}
                    disabled={isSubmitting || formData.meme_adresse}
                    className={validationErrors.pays_livraison && !formData.meme_adresse ? 'input-error' : ''}
                  />
                  {validationErrors.pays_livraison && !formData.meme_adresse && <span className="error-message">{validationErrors.pays_livraison}</span>}
                </div>
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
