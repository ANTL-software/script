import './rendezVousRecapModal.scss';

import { FaCalendarAlt, FaCheckCircle, FaPhoneAlt, FaStickyNote, FaTimes, FaUserTie } from 'react-icons/fa';

import { Button } from '../button/index.ts';
import type { RendezVousRecapData } from '../../../utils/types/index.ts';

interface RendezVousRecapModalProps {
  isOpen: boolean;
  recap: RendezVousRecapData | null;
  onClose: () => void;
}

export default function RendezVousRecapModal({
  isOpen,
  recap,
  onClose,
}: RendezVousRecapModalProps) {
  if (!isOpen || !recap) {
    return null;
  }

  return (
    <div className="rdv-recap-modal__overlay" onClick={onClose}>
      <div className="rdv-recap-modal" onClick={(event) => event.stopPropagation()}>
        <div className="rdv-recap-modal__header">
          <div className="rdv-recap-modal__title-wrap">
            <div className="rdv-recap-modal__icon">
              <FaCheckCircle />
            </div>
            <div>
              <h2>Recapitulatif du rendez-vous client</h2>
              <p>{recap.prospectLabel} • {recap.campaignLabel}</p>
            </div>
          </div>

          <button
            type="button"
            className="rdv-recap-modal__close"
            onClick={onClose}
            aria-label="Fermer le recapitulatif"
          >
            <FaTimes />
          </button>
        </div>

        <div className="rdv-recap-modal__body">
          <section className="rdv-recap-modal__speech-card">
            <h3>Resume de confirmation</h3>
            <p>
              Je vous confirme donc un rendez-vous le <strong>{recap.dateLabel}</strong> a <strong>{recap.heure}</strong>
              {recap.interlocuteurNom ? <> avec <strong>{recap.interlocuteurNom}</strong></> : null}
              {recap.interlocuteurRole ? <> ({recap.interlocuteurRole})</> : null}.
            </p>
          </section>

          <div className="rdv-recap-modal__grid">
            <article className="rdv-recap-modal__card">
              <h3><FaCalendarAlt /> Planification</h3>
              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>{recap.dateLabel}</dd>
                </div>
                <div>
                  <dt>Heure</dt>
                  <dd>{recap.heure}</dd>
                </div>
              </dl>
            </article>

            <article className="rdv-recap-modal__card">
              <h3><FaUserTie /> Interlocuteur</h3>
              <dl>
                <div>
                  <dt>Nom</dt>
                  <dd>{recap.interlocuteurNom}</dd>
                </div>
                <div>
                  <dt>Fonction</dt>
                  <dd>{recap.interlocuteurRole || 'Non renseignee'}</dd>
                </div>
              </dl>
            </article>

            <article className="rdv-recap-modal__card">
              <h3><FaPhoneAlt /> Contact direct</h3>
              <dl>
                <div>
                  <dt>Telephone</dt>
                  <dd>{recap.telephone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{recap.email || 'Non renseigne'}</dd>
                </div>
              </dl>
            </article>
          </div>

          <article className="rdv-recap-modal__notes-card">
            <h3><FaStickyNote /> Notes de qualification</h3>
            <p>{recap.notes || 'Aucune note complementaire saisie.'}</p>
          </article>
        </div>

        <div className="rdv-recap-modal__footer">
          <Button variant="primary" onClick={onClose} fullWidth>
            Fermer et passer au closing
          </Button>
        </div>
      </div>
    </div>
  );
}
