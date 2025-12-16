import './produitCard.scss';
import type { Produit } from '../../../utils/types';
import Button from '../button/Button';
import { FaShoppingCart } from 'react-icons/fa';

interface ProduitCardProps {
  produit: Produit;
  onAddToCart: (produit: Produit) => void;
}

export default function ProduitCard({ produit, onAddToCart }: ProduitCardProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="produit-card">
      <div className="produit-card__header">
        <h3 className="produit-card__title">{produit.nom_produit}</h3>
        {produit.Categorie && (
          <span className="produit-card__category">{produit.Categorie.nom_categorie}</span>
        )}
      </div>

      {produit.description && (
        <p className="produit-card__description">{produit.description}</p>
      )}

      <div className="produit-card__footer">
        <span className="produit-card__price">{formatCurrency(produit.prix_base)}</span>
        <Button
          variant="primary"
          size="small"
          onClick={() => onAddToCart(produit)}
        >
          <FaShoppingCart /> Ajouter
        </Button>
      </div>
    </div>
  );
}
