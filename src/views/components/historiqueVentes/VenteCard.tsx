import './venteCard.scss';

import { useState } from 'react';
import type { Vente } from '../../../utils/types';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/utils';
import { useCart } from '../../../hooks/useCart';
import { useToast } from '../../../hooks/useToast';
import { useCampaign } from '../../../hooks/useCampaign';

interface VenteCardProps {
  vente: Vente;
}

export default function VenteCard({ vente }: VenteCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { addItem, addPanier } = useCart();
  const { showToast } = useToast();
  const { produits, paniers } = useCampaign();

  const handleSendToCart = () => {
    let added = 0;
    let skipped = 0;

    (vente.details ?? []).forEach((detail) => {
      if (detail.id_panier) {
        const panierCourant = paniers.find((panier) => panier.id_panier === detail.id_panier);
        if (!panierCourant) {
          skipped++;
          return;
        }

        for (let index = 0; index < detail.quantite; index += 1) {
          addPanier(panierCourant);
        }
        added++;
        return;
      }

      // 1. On cherche le produit dans le catalogue courant (avec tarifs campagne)
      const catalogueProduit = produits.find((p) => p.id_produit === detail.id_produit);

      // 2. Fallback : le produit embarqué dans le détail de la vente
      const resolvedProduit = catalogueProduit ?? detail.produit ?? null;

      if (!resolvedProduit) {
        skipped++;
        return;
      }

      addItem(resolvedProduit, detail.quantite, detail.remise);
      added++;
    });

    if (added === 0) {
      showToast('warning', 'Aucun produit identifiable dans cette commande — rien n\'a été ajouté au panier.');
      return;
    }

    const msg = skipped > 0
      ? `${added} produit(s) ajouté(s) au panier (${skipped} ligne(s) sans référence ignorée(s)).`
      : `${added} produit(s) ajouté(s) au panier.`;

    showToast('success', msg);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatutClass = (statut: string): string => {
    switch (statut) {
      case 'validee':
        return 'vente-card__statut--success';
      case 'en_attente':
        return 'vente-card__statut--warning';
      case 'annulee':
        return 'vente-card__statut--danger';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      validee: 'Validée',
      en_attente: 'En attente',
      annulee: 'Annulée',
    };
    return labels[statut] || statut;
  };

  return (
    <div className="vente-card">
      <div className="vente-card__header">
        <div className="vente-card__info">
          <div className="vente-card__date-statut">
            <span className="vente-card__date">{formatDate(vente.created_at)}</span>
            <span className={`vente-card__statut ${getStatutClass(vente.statut)}`}>
              {getStatutLabel(vente.statut)}
            </span>
          </div>
          <div className="vente-card__montant">
            <span className="montant-label">Montant total :</span>
            <span className="montant-value">{formatCurrency(vente.montant_total)}</span>
          </div>
        </div>

        <button
          className={`vente-card__toggle ${isExpanded ? 'vente-card__toggle--expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼ Masquer détails' : '▶ Voir détails'}
        </button>
      </div>

      {isExpanded && (
        <div className="vente-card__details">
          <div className="vente-card__details-header">
            <h4>Détails de la commande</h4>
            <div className="vente-card__details-actions">
              {vente.mode_paiement && (
                <span className="vente-card__paiement">Paiement : {vente.mode_paiement}</span>
              )}
              <button
                className="vente-card__send-to-cart"
                onClick={handleSendToCart}
                title="Reprendre le contenu de cette commande dans le panier"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Envoyer vers le panier
              </button>
            </div>
          </div>

          {vente.details && vente.details.length > 0 ? (
            <div className="vente-card__products">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Remise</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {vente.details.map((detail, index) => (
                    <tr key={index}>
                      <td className="product-name">
                        {detail.panier ? (
                          <>
                            {detail.panier.label}
                            <span className="product-code"> (panier #{detail.panier.id_panier})</span>
                          </>
                        ) : detail.produit ? (
                          <>
                            {detail.produit.nom_produit} #{detail.produit.id_produit}
                            {detail.produit.code_produit && (
                              <span className="product-code"> ({detail.produit.code_produit})</span>
                            )}
                          </>
                        ) : (
                          `Ligne #${detail.id_detail ?? index + 1}`
                        )}
                      </td>
                      <td>{formatCurrency(detail.prix_unitaire)}</td>
                      <td>{detail.quantite}</td>
                      <td>{detail.remise > 0 ? formatCurrency(detail.remise) : '-'}</td>
                      <td className="product-total">
                        {formatCurrency(
                          calculateLineTotal(detail.prix_unitaire, detail.quantite, detail.remise)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="total-label">
                      Total
                    </td>
                    <td className="total-value">{formatCurrency(vente.montant_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="vente-card__no-details">Aucun détail disponible</p>
          )}
        </div>
      )}
    </div>
  );
}
