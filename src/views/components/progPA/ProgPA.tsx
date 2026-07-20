import { useProspect } from '../../../hooks/index.ts';
import type { CampaignVariant } from '../../../utils/scripts/index.ts';
import { getCampaignProgpaSteps } from '../../../utils/scripts/index.ts';
import './progPA.scss';

interface ProgPAProps {
  compact?: boolean;
  disabled?: boolean;
  campaignVariant?: CampaignVariant | null;
}

export default function ProgPA({ compact = false, disabled = false, campaignVariant = null }: ProgPAProps) {
  const { currentProgpa, setCurrentProgpa } = useProspect();
  const stepDefinitions = getCampaignProgpaSteps(campaignVariant);
  const activeStep = currentProgpa;
  const completedSteps = activeStep === null
    ? 0
    : stepDefinitions.filter((step) => step.value <= activeStep).length;
  const fillHeight = `${(completedSteps / stepDefinitions.length) * 100}%`;

  const handleStepChange = (value: number) => {
    if (disabled) {
      return;
    }
    setCurrentProgpa(value);
  };

  return (
    <aside
      className={`prog-pa${compact ? ' prog-pa--compact' : ''}${disabled ? ' prog-pa--disabled' : ''}`}
      aria-label="Progression du plan d'appel"
    >
      <div className="prog-pa__panel">
        <div className="prog-pa__header">
          <span className="prog-pa__eyebrow">Plan d'appel</span>
          <strong className="prog-pa__value">{activeStep === null ? '-/5' : `${activeStep}/5`}</strong>
        </div>

        <div className="prog-pa__track" role="presentation">
          <div className="prog-pa__track-base" />
          <div
            className="prog-pa__track-fill"
            style={{ height: fillHeight }}
          />

          {Array.from({ length: stepDefinitions.length - 1 }, (_, index) => (
            <span
              key={`separator-${index}`}
              className="prog-pa__separator"
              style={{ bottom: `${((index + 1) / stepDefinitions.length) * 100}%` }}
            />
          ))}

          {stepDefinitions.map((step) => {
            return (
              <button
                key={step.value}
                type="button"
                className="prog-pa__step"
                onClick={() => handleStepChange(step.value)}
                aria-label={`${step.label}, etape ${step.value} sur 5`}
                aria-pressed={activeStep !== null && step.value <= activeStep}
                disabled={disabled}
              >
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
