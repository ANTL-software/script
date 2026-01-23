import './panierItem.scss';
import type { CartItem } from '../../../utils/types';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/utils';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

interface PanierItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantite: number) => void;
  onRemove: (productId: number) => void;
}

export default function PanierItem({ item, onUpdateQuantity, onRemove }: PanierItemProps) {
  const subtotal = calculateLineTotal(item.prix_unitaire, item.quantite, item.remise);

  const handleIncrement = () => {
    onUpdateQuantity(item.produit.id_produit, item.quantite + 1);
  };

  const handleDecrement = () => {
    if (item.quantite > 1) {
      onUpdateQuantity(item.produit.id_produit, item.quantite - 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.produit.id_produit);
  };

  return (
    <div className="panier-item">
      <div className="panier-item__header">
        <h4 className="panier-item__name">{item.produit.nom_produit}</h4>
        <button className="panier-item__remove" onClick={handleRemove} aria-label="Supprimer">
          <FaTrash />
        </button>
      </div>

      <div className="panier-item__details">
        <span className="panier-item__price">{formatCurrency(item.prix_unitaire)}</span>
        {item.remise > 0 && (
          <span className="panier-item__remise">- {formatCurrency(item.remise)}</span>
        )}
      </div>

      <div className="panier-item__controls">
        <div className="panier-item__quantity">
          <button
            className="quantity-btn"
            onClick={handleDecrement}
            disabled={item.quantite <= 1}
            aria-label="Diminuer"
          >
            <FaMinus />
          </button>
          <span className="quantity-value">{item.quantite}</span>
          <button
            className="quantity-btn"
            onClick={handleIncrement}
            aria-label="Augmenter"
          >
            <FaPlus />
          </button>
        </div>

        <span className="panier-item__subtotal">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
