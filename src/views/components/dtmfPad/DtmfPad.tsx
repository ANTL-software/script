import './dtmfPad.scss';
import { useEffect, useMemo, useState } from 'react';
import { LuKeyboard } from 'react-icons/lu';
import { useDialer } from '../../../hooks/index.ts';

const DTMF_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
};

export default function DtmfPad() {
  const { canSendDigits, lastSentDigits, sendDigits, currentCallInsights } = useDialer();
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!canSendDigits) {
      queueMicrotask(() => setIsOpen(false));
    }
  }, [canSendDigits]);

  useEffect(() => {
    if (!canSendDigits) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const key = event.key;
      if (!DTMF_KEYS.includes(key as typeof DTMF_KEYS[number])) {
        return;
      }

      const isAltGraph = event.getModifierState?.('AltGraph') ?? false;
      if (event.metaKey || (event.ctrlKey && !isAltGraph) || (event.altKey && !isAltGraph)) {
        return;
      }

      event.preventDefault();
      if (sendDigits(key)) {
        setActiveKey(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSendDigits, sendDigits]);

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActiveKey(null), 180);
    return () => window.clearTimeout(timeoutId);
  }, [activeKey]);

  const sentDigitsLabel = useMemo(() => {
    return lastSentDigits || 'Aucune touche envoyée';
  }, [lastSentDigits]);

  const qualificationLabel = useMemo(() => {
    switch (currentCallInsights.classification) {
      case 'humain_detecte':
        return 'Humain détecté';
      case 'svi_detecte':
        return 'SVI détecté';
      case 'automate_filtre':
        return 'Automate filtré';
      case 'messagerie_detectee':
        return 'Messagerie détectée';
      case 'fax_detecte':
        return 'Fax détecté';
      case 'unknown_a_traiter':
        return 'Décroché inconnu';
      case 'qualification_en_cours':
        return 'Qualification en cours';
      default:
        return 'Analyse en cours';
    }
  }, [currentCallInsights.classification]);

  const systemOutcomeLabel = useMemo(() => {
    if (!currentCallInsights.endedBySystem) {
      return null;
    }

    switch (currentCallInsights.endReason) {
      case 'messagerie_detectee':
        return 'Fin automatique: messagerie confirmée';
      case 'fax_detecte':
        return 'Fin automatique: fax détecté';
      case 'automate_filtre':
        return 'Fin automatique: machine_start filtré';
      default:
        return 'Fin automatique par le système';
    }
  }, [currentCallInsights.endedBySystem, currentCallInsights.endReason]);

  if (!canSendDigits) {
    return null;
  }

  return (
    <div className={`dtmf-pad ${isOpen ? 'dtmf-pad--open' : ''}`}>
      <button
        type="button"
        className="dtmf-pad__trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Ouvrir le clavier SVI"
      >
        <LuKeyboard size={16} />
        <span>Clavier SVI</span>
      </button>

      {isOpen && (
        <div className="dtmf-pad__panel">
          <div className="dtmf-pad__meta">
            <p className="dtmf-pad__title">Menu vocal</p>
            <p className="dtmf-pad__hint">
              {currentCallInsights.sviDetecte ? 'SVI détecté: vous pouvez taper les touches nécessaires.' : 'Clavier physique: 0-9, *, #'}
            </p>
          </div>

          <div className="dtmf-pad__digits" aria-live="polite">
            <span className="dtmf-pad__digits-label">Qualification</span>
            <span className="dtmf-pad__digits-value">{qualificationLabel}</span>
          </div>

          {systemOutcomeLabel && (
            <div className="dtmf-pad__digits" aria-live="polite">
              <span className="dtmf-pad__digits-label">Fin d'appel</span>
              <span className="dtmf-pad__digits-value">{systemOutcomeLabel}</span>
            </div>
          )}

          <div className="dtmf-pad__digits" aria-live="polite">
            <span className="dtmf-pad__digits-label">Touches envoyées</span>
            <span className="dtmf-pad__digits-value">{sentDigitsLabel}</span>
          </div>

          <div className="dtmf-pad__grid">
            {DTMF_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className={`dtmf-pad__key ${activeKey === key ? 'dtmf-pad__key--active' : ''}`}
                onClick={() => {
                  if (sendDigits(key)) {
                    setActiveKey(key);
                  }
                }}
                aria-label={`Envoyer la touche ${key}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
