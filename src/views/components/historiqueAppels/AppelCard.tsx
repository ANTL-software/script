import './appelCard.scss';

import type { Appel } from '../../../utils/types/index.ts';
import { formatDateShort, formatTime, formatDurationFromSeconds, getStatutAppelClass, getStatutAppelLabel } from '../../../utils/scripts/index.ts';

interface AppelCardProps {
  appel: Appel;
}

export default function AppelCard({ appel }: AppelCardProps) {

  return (
    <div className="appel-card">
      <div className="appel-card__header">
        <div className="appel-card__date-time">
          <span className="appel-card__date">{formatDateShort(appel.created_at)}</span>
          <span className="appel-card__time">{formatTime(appel.created_at)}</span>
        </div>
        <span className={`appel-card__statut ${getStatutAppelClass(appel.statut_appel)}`}>
          {getStatutAppelLabel(appel.statut_appel)}
        </span>
      </div>

      <div className="appel-card__body">
        <div className="appel-card__info">
          <div className="appel-card__info-item">
            <span className="info-label">Durée:</span>
            <span className="info-value">{formatDurationFromSeconds(appel.duree_secondes ?? null)}</span>
          </div>
          {appel.Employe && (
            <div className="appel-card__info-item">
              <span className="info-label">Agent:</span>
              <span className="info-value">
                {appel.Employe.prenom} {appel.Employe.nom}
              </span>
            </div>
          )}
        </div>

        <div className="appel-card__notes">
          <div className="appel-card__notes-header">
            <span className="info-label">Notes:</span>
          </div>
          <p className="appel-card__notes-text">
            {appel.notes || <em>Aucune note</em>}
          </p>
        </div>
      </div>
    </div>
  );
}
