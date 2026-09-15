import type { GoogleBookingCopyField, LeadExternalBookingConfig } from '../../../utils/types/index.ts';

import './googleAppointmentBooking.scss';

interface GoogleAppointmentBookingProps {
  config: LeadExternalBookingConfig;
  copyFields: GoogleBookingCopyField[];
  dateRdv: string;
  timeValue: string;
  today: string;
  isConfirmed: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  onCopyField: (value: string, label: string) => Promise<void>;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onConfirmedChange: (confirmed: boolean) => void;
}

export default function GoogleAppointmentBooking({
  config,
  copyFields,
  dateRdv,
  timeValue,
  today,
  isConfirmed,
  isSaving,
  errors,
  onCopyField,
  onDateChange,
  onTimeChange,
  onConfirmedChange,
}: GoogleAppointmentBookingProps) {
  return (
    <div className="google-appointment-booking">
      <div className="google-appointment-booking__instructions">
        <strong>Réservez d'abord le créneau dans l'agenda de {config.ownerLabel}.</strong>
        <span>Google ne permet pas le préremplissage automatique avec ce lien public. Utilisez les boutons ci-dessous pour reprendre rapidement les informations de la fiche.</span>
        <span>Le nom complet est à répartir entre les champs Prénom et Nom du formulaire Google.</span>
      </div>

      <div className="google-appointment-booking__copy-grid" aria-label="Informations à reporter dans Google Agenda">
        {copyFields.map((field) => (
          <div className="google-appointment-booking__copy-field" key={field.key}>
            <span className="google-appointment-booking__copy-label">{field.label}</span>
            <span className={`google-appointment-booking__copy-value ${field.value ? '' : 'google-appointment-booking__copy-value--empty'}`}>
              {field.value || 'Non renseigné'}
            </span>
            <button
              type="button"
              className="google-appointment-booking__copy-button"
              disabled={isSaving || !field.value}
              onClick={() => void onCopyField(field.value, field.label)}
            >
              Copier
            </button>
          </div>
        ))}
      </div>

      <div className="google-appointment-booking__calendar">
        <iframe
          src={config.embedUrl}
          title={`Agenda de réservation de ${config.ownerLabel}`}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      <a
        className="google-appointment-booking__external-link"
        href={config.bookingUrl}
        target="_blank"
        rel="noreferrer"
      >
        Ouvrir l'agenda Google dans un nouvel onglet
      </a>

      <label className={`google-appointment-booking__confirmation ${errors.externalBooking ? 'google-appointment-booking__confirmation--error' : ''}`}>
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          disabled={isSaving}
        />
        La réservation est confirmée dans l'agenda Google de {config.ownerLabel}
      </label>
      {errors.externalBooking && <span className="error-message">{errors.externalBooking}</span>}

      <div className="google-appointment-booking__antl-report">
        <div className="google-appointment-booking__report-header">
          <strong>Report antl</strong>
          <span>Recopiez la date et l'heure affichées par Google pour générer la fiche de rendez-vous et la facturation.</span>
        </div>
        <div className="form-row">
          <div className={`form-group ${errors.dateRdv ? 'form-group--error' : ''}`}>
            <label htmlFor="dateRdv">
              Date réservée <span className="required">*</span>
            </label>
            <input
              id="dateRdv"
              type="date"
              min={today}
              value={dateRdv}
              onChange={(event) => onDateChange(event.target.value)}
              disabled={isSaving}
            />
            {errors.dateRdv && <span className="error-message">{errors.dateRdv}</span>}
          </div>
          <div className={`form-group ${errors.heureRdv ? 'form-group--error' : ''}`}>
            <label htmlFor="googleBookingTime">
              Heure réservée <span className="required">*</span>
            </label>
            <input
              id="googleBookingTime"
              type="time"
              step="60"
              value={timeValue}
              onChange={(event) => onTimeChange(event.target.value)}
              disabled={isSaving}
            />
            {errors.heureRdv && <span className="error-message">{errors.heureRdv}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
