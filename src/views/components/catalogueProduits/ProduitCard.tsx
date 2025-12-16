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

  // Utiliser le prix du tarif si disponible, sinon le prix du produit
  const prixUnitaire = typeof produit.prix_unitaire === 'number'
    ? produit.prix_unitaire
    : (typeof produit.prix_unitaire === 'string' ? parseFloat(produit.prix_unitaire) : 0);

  const prixPromo = produit.prix_promo
    ? (typeof produit.prix_promo === 'number' ? produit.prix_promo : parseFloat(String(produit.prix_promo)))
    : null;

  const hasPrixPromo = prixPromo !== null && prixPromo > 0;
  const prixAffiche = hasPrixPromo ? prixPromo : prixUnitaire;

  return (
    <div className="produit-card">
      <div className="produit-card__header">
        <h3 className="produit-card__title">{produit.nom_produit}</h3>
        {(produit.Categorie || produit.categorie) && (
          <span className="produit-card__category">
            {produit.Categorie?.nom_categorie || produit.categorie?.nom_categorie}
          </span>
        )}
      </div>

      {produit.description && (
        <p className="produit-card__description">{produit.description}</p>
      )}

      <div className="produit-card__footer">
        <div className="produit-card__price-container">
          {hasPrixPromo && (
            <span className="produit-card__price--original">{formatCurrency(prixUnitaire)}</span>
          )}
          <span className={`produit-card__price ${hasPrixPromo ? 'produit-card__price--promo' : ''}`}>
            {formatCurrency(prixAffiche)}
          </span>
        </div>
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
