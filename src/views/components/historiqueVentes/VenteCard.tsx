import './venteCard.scss';

import { useState } from 'react';
import type { Vente } from '../../../utils/types';

interface VenteCardProps {
  vente: Vente;
}

export default function VenteCard({ vente }: VenteCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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

  const calculateLineTotal = (prixUnitaire: number, quantite: number, remise: number): number => {
    return prixUnitaire * quantite - remise;
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
            {vente.mode_paiement && (
              <span className="vente-card__paiement">Paiement : {vente.mode_paiement}</span>
            )}
          </div>

          {vente.DetailsVentes && vente.DetailsVentes.length > 0 ? (
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
                  {vente.DetailsVentes.map((detail, index) => (
                    <tr key={index}>
                      <td className="product-name">
                        {detail.Produit?.nom_produit || `Produit #${detail.id_produit}`}
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
