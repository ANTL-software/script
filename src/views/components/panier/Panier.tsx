import './panier.scss';
import { useCart, useToast } from '../../../hooks';
import { formatCurrency } from '../../../utils/scripts/utils';
import PanierItem from './PanierItem';
import Button from '../button/Button';
import { FaShoppingCart, FaTrash, FaCheck } from 'react-icons/fa';

interface PanierProps {
  onValidateOrder?: () => void;
}

export default function Panier({ onValidateOrder }: PanierProps) {
  const { items, total, itemCount, clearCart, updateQuantity, removeItem } = useCart();
  const { confirm, showToast } = useToast();

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: 'Vider le panier',
      message: 'Voulez-vous vraiment vider le panier ? Cette action est irréversible.',
      type: 'danger',
      confirmText: 'Vider',
      cancelText: 'Annuler',
    });

    if (confirmed) {
      clearCart();
      showToast('success', 'Le panier a été vidé');
    }
  };

  const handleValidateOrder = () => {
    if (items.length === 0) {
      showToast('warning', 'Le panier est vide');
      return;
    }
    if (onValidateOrder) {
      onValidateOrder();
    }
  };

  return (
    <div className="panier">
      <div className="panier__header">
        <h3>
          <FaShoppingCart /> Panier
        </h3>
        {itemCount > 0 && (
          <span className="panier__badge">{itemCount}</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="panier__empty">
          <FaShoppingCart />
          <p>Votre panier est vide</p>
        </div>
      ) : (
        <>
          <div className="panier__items">
            {items.map((item) => (
              <PanierItem
                key={item.produit.id_produit}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="panier__footer">
            <div className="panier__total">
              <span className="panier__total-label">Total</span>
              <span className="panier__total-amount">{formatCurrency(total)}</span>
            </div>

            <div className="panier__actions">
              <Button
                variant="danger"
                size="small"
                fullWidth
                onClick={handleClearCart}
              >
                <FaTrash /> Vider le panier
              </Button>
              <Button
                variant="primary"
                size="medium"
                fullWidth
                onClick={handleValidateOrder}
              >
                <FaCheck /> Valider la commande
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
