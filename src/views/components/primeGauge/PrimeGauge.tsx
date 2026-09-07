import './primeGauge.scss';
import type { PrimeStats } from '../../../utils/types/index.ts';
import {
  formatPrimeAmount,
  formatPrimeBonus,
  formatPrimeObjective,
  formatPrimeProduction,
  sortPrimeThresholds,
} from '../../../utils/scripts/index.ts';

interface PrimeGaugeProps {
  ventesMoisCount: number;
  ventesMoisEnAttenteCount?: number;
  ventesMoisEnAttenteMontant?: number;
  prime: PrimeStats;
}

export default function PrimeGauge({
  ventesMoisCount,
  ventesMoisEnAttenteCount,
  ventesMoisEnAttenteMontant,
  prime,
}: PrimeGaugeProps) {
  const pourcentage = Math.min(prime.pourcentage_atteint, 100);
  const seuils = sortPrimeThresholds(prime.paliers);
  const isSalesCampaign = prime.type_campagne === 'vente';

  return (
    <div className="prime-gauge">
      <div className="prime-gauge__header">
        <div className="prime-gauge__header-left">
          <span className="prime-gauge__niveau">{prime.libelle}</span>
          <span className="prime-gauge__mois-stats">
            {formatPrimeProduction(prime, ventesMoisCount)}
            {isSalesCampaign && ventesMoisEnAttenteCount !== undefined && (
              <span className="prime-gauge__en-attente-stats" title="Ventes en attente de validation ce mois-ci">
                {' '}({ventesMoisEnAttenteCount} en attente · {formatPrimeAmount(ventesMoisEnAttenteMontant ?? 0)})
              </span>
            )}
          </span>
        </div>
        <div className="prime-gauge__header-right">
          <span className={prime.prime_debloquee > 0 ? 'prime-gauge__prime prime-gauge__prime--active' : 'prime-gauge__prime prime-gauge__prime--none'}>
            Prime débloquée : {formatPrimeAmount(prime.prime_debloquee)}
          </span>
          <span className="prime-gauge__objectif">
            Objectif 100 % : {formatPrimeObjective(prime.objectif, prime.unite_objectif)}
          </span>
        </div>
      </div>

      <div className="prime-gauge__track-wrapper">
        <div className="prime-gauge__track">
          <div className="prime-gauge__fill" style={{ width: `${pourcentage}%` }} />
          {seuils.map((seuil) => (
            <div
              key={seuil.seuil_pourcentage}
              className={`prime-gauge__marker ${seuil.debloque ? 'prime-gauge__marker--unlocked' : ''}`}
              style={{ left: `${seuil.seuil_pourcentage}%` }}
            >
              <div className="prime-gauge__marker-line" />
            </div>
          ))}
        </div>

        <div className="prime-gauge__labels">
          {seuils.map((seuil) => (
            <div
              key={seuil.seuil_pourcentage}
              className={`prime-gauge__label ${seuil.debloque ? 'prime-gauge__label--unlocked' : ''}`}
              style={{ left: `${seuil.seuil_pourcentage}%` }}
            >
              <span className="prime-gauge__label-pct">{seuil.seuil_pourcentage}%</span>
              <span className="prime-gauge__label-objective">
                {formatPrimeObjective(seuil.objectif_palier, prime.unite_objectif)}
              </span>
              <span className="prime-gauge__label-prime">{formatPrimeBonus(seuil, prime.salaire_fixe)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="prime-gauge__progress-text">
        <span>{formatPrimeObjective(prime.valeur_realisee, prime.unite_objectif)}</span>
        <span className="prime-gauge__pct-value">{prime.pourcentage_atteint.toFixed(1)}%</span>
        <span>{formatPrimeObjective(prime.objectif, prime.unite_objectif)}</span>
      </div>
    </div>
  );
}
