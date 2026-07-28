import type { CampaignVariant } from '../../../utils/scripts/index.ts';
import { getCampaignProgpaSteps } from '../../../utils/scripts/index.ts';

interface ProgPAReadonlyProps {
  value: number | null | undefined;
  campaignVariant?: CampaignVariant | null;
}

function normalizeProgpa(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(5, Math.round(value)));
}

export default function ProgPAReadonly({ value, campaignVariant = null }: ProgPAReadonlyProps) {
  const activeStep = normalizeProgpa(value);
  const stepDefinitions = [...getCampaignProgpaSteps(campaignVariant)].reverse();
  const currentStep = stepDefinitions.find((step) => step.value === activeStep);

  return (
    <section className="prog-pa-readonly" aria-label={`Progression du plan d'appel : ${activeStep} sur 5`}>
      <div className="prog-pa-readonly__summary">
        <span className="prog-pa-readonly__eyebrow">Max. progPA atteint</span>
        <strong className="prog-pa-readonly__value">{activeStep}<span>/5</span></strong>
      </div>

      <div className="prog-pa-readonly__steps" role="list" aria-label="Étapes du plan d'appel">
        {stepDefinitions.map((step) => {
          const isComplete = step.value <= activeStep;
          const isCurrent = step.value === activeStep;

          return (
            <div
              key={step.value}
              className="prog-pa-readonly__step"
              data-complete={isComplete}
              data-current={isCurrent}
              role="listitem"
            >
              <span className="prog-pa-readonly__step-dot" aria-hidden="true">{step.value}</span>
              <span className="prog-pa-readonly__step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      <p className="prog-pa-readonly__current-step">
        <span>Palier actuel</span>
        {currentStep?.label ?? 'Aucun contact'}
      </p>
    </section>
  );
}
