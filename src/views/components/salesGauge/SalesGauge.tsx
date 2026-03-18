import './salesGauge.scss';
import type { PrimeStats } from '../../../utils/types';

interface SalesGaugeProps {
  ventesMoisCount: number;
  ventesMoisMontant: number;
  prime: PrimeStats;
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function SalesGauge({ ventesMoisCount, ventesMoisMontant, prime }: SalesGaugeProps) {
  const pourcentage = Math.min(prime.pourcentage_atteint, 100);
  const paliers = [...prime.paliers].sort((a, b) => a.seuil_pourcentage - b.seuil_pourcentage);

  return (
    <div className="sales-gauge">
      <div className="sales-gauge__header">
        <div className="sales-gauge__header-left">
          <span className="sales-gauge__niveau">{prime.libelle}</span>
          <span className="sales-gauge__mois-stats">
            {ventesMoisCount} vente{ventesMoisCount > 1 ? 's' : ''} · {formatEur(ventesMoisMontant)}
          </span>
        </div>
        <div className="sales-gauge__header-right">
          {prime.prime_debloquee > 0 ? (
            <span className="sales-gauge__prime sales-gauge__prime--active">
              Prime : {formatEur(prime.prime_debloquee)}
            </span>
          ) : (
            <span className="sales-gauge__prime sales-gauge__prime--none">
              Aucune prime débloquée
            </span>
          )}
          <span className="sales-gauge__objectif">Objectif : {formatEur(prime.objectif_mensuel)}</span>
        </div>
      </div>

      <div className="sales-gauge__track-wrapper">
        <div className="sales-gauge__track">
          <div
            className="sales-gauge__fill"
            style={{ width: `${pourcentage}%` }}
          />

          {paliers.map(palier => (
            <div
              key={palier.seuil_pourcentage}
              className={`sales-gauge__marker ${palier.debloque ? 'sales-gauge__marker--unlocked' : ''}`}
              style={{ left: `${palier.seuil_pourcentage}%` }}
            >
              <div className="sales-gauge__marker-line" />
            </div>
          ))}
        </div>

        <div className="sales-gauge__labels">
          {paliers.map(palier => (
            <div
              key={palier.seuil_pourcentage}
              className={`sales-gauge__label ${palier.debloque ? 'sales-gauge__label--unlocked' : ''}`}
              style={{ left: `${palier.seuil_pourcentage}%` }}
            >
              <span className="sales-gauge__label-pct">{palier.seuil_pourcentage}%</span>
              <span className="sales-gauge__label-prime">{formatEur(palier.montant_prime)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sales-gauge__progress-text">
        <span>{formatEur(ventesMoisMontant)}</span>
        <span className="sales-gauge__pct-value">{prime.pourcentage_atteint.toFixed(1)}%</span>
        <span>{formatEur(prime.objectif_mensuel)}</span>
      </div>
    </div>
  );
}
