import './dialerStatus.scss';
import { useState, useEffect, useRef } from 'react';
import { useDialer } from '../../../hooks';
import type { StatutDialer, RaisonPause } from '../../../utils/types';
import { formatTimerDuration } from '../../../utils/scripts/formatters';

const LABELS_STATUT: Record<StatutDialer, string> = {
  disponible: 'Disponible',
  en_appel: 'En appel',
  appel_sortant: 'Appel sortant',
  pause_apres_appel: 'Pause après appel',
  pause: 'En pause',
  hors_ligne: 'Hors ligne',
};

const LABELS_PAUSE: Record<RaisonPause, string> = {
  technique: 'Pause technique',
  repas: 'Pause repas',
  personnelle: 'Pause personnelle',
  legale: 'Pause légale',
  brief: 'Pause Brief',
};

const RAISONS_PAUSE: RaisonPause[] = ['repas', 'personnelle', 'legale', 'brief', 'technique'];

export default function DialerStatus() {
  const { statut, raisonPause, depuisLe, isLoading, changerStatut } = useDialer();
  const [isOpen, setIsOpen] = useState(false);
  const [duree, setDuree] = useState('00:00');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuree(formatTimerDuration(depuisLe));
    }, 1000);
    return () => clearInterval(interval);
  }, [depuisLe]);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStatut = async (nouveauStatut: StatutDialer, raison?: RaisonPause) => {
    // Statuts automatiques / non sélectionnables manuellement
    if (nouveauStatut === 'en_appel' || nouveauStatut === 'pause_apres_appel' || nouveauStatut === 'hors_ligne') return;
    setIsOpen(false);
    await changerStatut(nouveauStatut, raison);
  };

  const labelActuel = statut === 'pause' && raisonPause
    ? LABELS_PAUSE[raisonPause]
    : LABELS_STATUT[statut];

  return (
    <div className={`dialer-status dialer-status--${statut}`} ref={dropdownRef}>
      <button
        className="dialer-status__trigger"
        onClick={() => setIsOpen((o) => !o)}
        disabled={isLoading || statut === 'en_appel'}
        aria-expanded={isOpen}
      >
        <span className="dialer-status__dot" />
        <span className="dialer-status__label">{labelActuel}</span>
        {(statut === 'pause' || statut === 'pause_apres_appel' || statut === 'en_appel' || statut === 'appel_sortant') && (
          <span className="dialer-status__timer">{duree}</span>
        )}
        {statut !== 'en_appel' && (
          <span className={`dialer-status__arrow ${isOpen ? 'dialer-status__arrow--open' : ''}`}>▾</span>
        )}
      </button>

      {isOpen && (
        <div className="dialer-status__dropdown">
          <div className="dialer-status__dropdown-section">
            <button
              className={`dialer-status__option dialer-status__option--disponible ${statut === 'disponible' ? 'dialer-status__option--active' : ''}`}
              onClick={() => handleSelectStatut('disponible')}
            >
              <span className="dialer-status__dot dialer-status__dot--disponible" />
              Disponible
            </button>
            <button
              className={`dialer-status__option dialer-status__option--appel_sortant ${statut === 'appel_sortant' ? 'dialer-status__option--active' : ''}`}
              onClick={() => handleSelectStatut('appel_sortant')}
            >
              <span className="dialer-status__dot dialer-status__dot--appel_sortant" />
              Appel sortant
            </button>
          </div>

          <div className="dialer-status__dropdown-divider" />

          <div className="dialer-status__dropdown-section">
            <p className="dialer-status__dropdown-label">Pauses</p>
            {RAISONS_PAUSE.map((raison) => (
              <button
                key={raison}
                className={`dialer-status__option dialer-status__option--pause ${statut === 'pause' && raisonPause === raison ? 'dialer-status__option--active' : ''}`}
                onClick={() => handleSelectStatut('pause', raison)}
              >
                <span className="dialer-status__dot dialer-status__dot--pause" />
                {LABELS_PAUSE[raison]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
