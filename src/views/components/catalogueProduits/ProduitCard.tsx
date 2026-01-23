import './produitCard.scss';
import type { Produit } from '../../../utils/types';
import { formatCurrency, parsePrice } from '../../../utils/scripts/utils';
import Button from '../button/Button';
import { FaShoppingCart } from 'react-icons/fa';

interface ProduitCardProps {
  produit: Produit;
  onAddToCart: (produit: Produit) => void;
}

export default function ProduitCard({ produit, onAddToCart }: ProduitCardProps) {
  const prixUnitaire = parsePrice(produit.prix_unitaire);
  const prixPromo = produit.prix_promo ? parsePrice(produit.prix_promo) : null;

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
