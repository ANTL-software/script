import './cataloguePaniers.scss';
import { useState } from 'react';
import type { CampaignPanier } from '../../../utils/types';
import { formatCurrency } from '../../../utils/scripts/utils';
import Button from '../button/Button';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import { FaBoxesStacked, FaLayerGroup, FaPlus } from 'react-icons/fa6';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface CataloguePaniersProps {
  paniers: CampaignPanier[];
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  onAddPanier: (panier: CampaignPanier) => void;
}

export default function CataloguePaniers({
  paniers,
  isLoading,
  error,
  onClearError,
  onAddPanier,
}: CataloguePaniersProps) {
  const [isRootExpanded, setIsRootExpanded] = useState(false);
  const [expandedPanierId, setExpandedPanierId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section className="catalogue-paniers">
        <div className="catalogue-paniers__loader">
          <Loader size="medium" />
          <p>Chargement des kits...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="catalogue-paniers">
        <ErrorMessage message={error} onClose={onClearError} />
      </section>
    );
  }

  if (paniers.length === 0) {
    return null;
  }

  return (
    <section className="catalogue-paniers">
      <button
        type="button"
        className="catalogue-paniers__root-toggle"
        onClick={() => setIsRootExpanded((prev) => !prev)}
      >
        <span className="catalogue-paniers__root-icon">
          {isRootExpanded ? <FaChevronDown /> : <FaChevronRight />}
        </span>
        <span className="catalogue-paniers__root-title">
          <FaBoxesStacked />
          <strong>Kits / Paniers</strong>
        </span>
        <span className="catalogue-paniers__badge">{paniers.length}</span>
      </button>

      {isRootExpanded && (
        <div className="catalogue-paniers__content">
          <p className="catalogue-paniers__intro">
            Ajoutez rapidement des compositions prêtes à vendre, en complément des articles à l'unité.
          </p>

          <div className="catalogue-paniers__list">
            {paniers.map((panier) => {
              const isExpanded = expandedPanierId === panier.id_panier;

              return (
                <article key={panier.id_panier} className="catalogue-paniers__item">
                  <button
                    type="button"
                    className="catalogue-paniers__item-header"
                    onClick={() => setExpandedPanierId((prev) => prev === panier.id_panier ? null : panier.id_panier)}
                  >
                    <span className="catalogue-paniers__item-toggle">
                      {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                    <div className="catalogue-paniers__item-info">
                      <h4>{panier.label}</h4>
                      <span className="catalogue-paniers__meta">
                        <FaLayerGroup /> {panier.total_produits} article{panier.total_produits > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="catalogue-paniers__item-side">
                      <div className="catalogue-paniers__price">
                        <span>Total estimé HT</span>
                        <strong>
                          {panier.has_missing_price
                            ? 'Prix à confirmer'
                            : formatCurrency(panier.montant_estime_ht)}
                        </strong>
                      </div>
                      <Button
                        variant="tertiary"
                        size="small"
                        disabled={panier.has_missing_price}
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddPanier(panier);
                        }}
                      >
                        <FaPlus /> Ajouter
                      </Button>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="catalogue-paniers__item-content">
                      <ul className="catalogue-paniers__products">
                        {panier.produits.map((produit) => (
                          <li key={produit.id_produit}>
                            <span>{produit.nom_produit}</span>
                            {produit.prix_unitaire != null && (
                              <strong>
                                {formatCurrency(typeof produit.prix_unitaire === 'number' ? produit.prix_unitaire : parseFloat(String(produit.prix_unitaire)))}
                              </strong>
                            )}
                          </li>
                        ))}
                      </ul>

                      {panier.has_missing_price && (
                        <p className="catalogue-paniers__warning">
                          Certains articles n'ont pas encore de prix campagne.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
