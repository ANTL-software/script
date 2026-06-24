import { useProspect } from '../../../hooks/useProspect';
import './progPA.scss';

const STEP_DEFINITIONS = [
  { value: 5, label: 'Commande' },
  { value: 4, label: 'Proposition' },
  { value: 3, label: 'Decouverte' },
  { value: 2, label: 'Presentation' },
  { value: 1, label: 'Identification' },
  { value: 0, label: 'Aucun contact' },
];

interface ProgPAProps {
  compact?: boolean;
  disabled?: boolean;
}

export default function ProgPA({ compact = false, disabled = false }: ProgPAProps) {
  const { currentProgpa, setCurrentProgpa } = useProspect();
  const activeStep = currentProgpa;
  const completedSteps = activeStep === null
    ? 0
    : STEP_DEFINITIONS.filter((step) => step.value <= activeStep).length;
  const fillHeight = `${(completedSteps / STEP_DEFINITIONS.length) * 100}%`;

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

          {Array.from({ length: STEP_DEFINITIONS.length - 1 }, (_, index) => (
            <span
              key={`separator-${index}`}
              className="prog-pa__separator"
              style={{ bottom: `${((index + 1) / STEP_DEFINITIONS.length) * 100}%` }}
            />
          ))}

          {STEP_DEFINITIONS.map((step) => {
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
