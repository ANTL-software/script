import Select, { type StylesConfig } from 'react-select';

import { usePriseRendezVous } from '../../../hooks/index.ts';
import type { RendezVousTimeOption } from '../../../utils/types/index.ts';
import { RendezVousRecapModal } from '../rendezVousRecapModal/index.ts';
import './priseRendezVousPlaceholder.scss';

const selectStyles: StylesConfig<RendezVousTimeOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '32px',
    height: '32px',
    background: '#f5f5f7',
    borderColor: state.isFocused ? '#7c3aed' : '#e5e5e7',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(124, 58, 237, 0.3)' : undefined,
    fontSize: '0.875rem',
    borderRadius: '4px',
    outline: 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#7c3aed' : '#d2d2d7',
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: '32px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1d1d1f',
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '32px',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px',
  }),
  indicatorSeparator: (base) => ({
    ...base,
    display: 'none',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    padding: '4px 8px',
    backgroundColor: state.isSelected
      ? '#7c3aed'
      : state.isFocused
        ? '#ede9fe'
        : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#1d1d1f',
    '&:active': {
      backgroundColor: state.isSelected ? '#7c3aed' : '#ede9fe',
    },
  }),
  menu: (base) => ({
    ...base,
    marginTop: '2px',
    borderRadius: '4px',
  }),
};

export default function PriseRendezVousPlaceholder() {
  const {
    dateRdv,
    heureRdv,
    heureInput,
    minuteInput,
    interlocuteurNom,
    interlocuteurRole,
    telephone,
    email,
    notes,
    isSaving,
    errors,
    recap,
    isRecapOpen,
    todayStr,
    timeSlots,
    handleDateChange,
    handleSelectHeureChange,
    handleHeureInputChange,
    handleMinuteInputChange,
    handleInterlocuteurNomChange,
    handleTelephoneChange,
    setInterlocuteurRole,
    setEmail,
    setNotes,
    handleSubmit,
    handleRecapClose,
  } = usePriseRendezVous();

  return (
    <>
      <section className="prise-rdv-form">
        <div className="prise-rdv-form__header">
          <h2>Prise de rendez-vous client</h2>
          <p>Formulaire de qualification et de prise de rendez-vous B2B pour le compte de notre partenaire MMA.</p>
        </div>

        <form className="prise-rdv-form__form" onSubmit={handleSubmit}>
          <div className="form-card">
            <h3 className="form-card__title">1. Planification</h3>
            <div className="form-row">
              <div className={`form-group ${errors.dateRdv ? 'form-group--error' : ''}`}>
                <label htmlFor="dateRdv">
                  Date (Mardi & Jeudi uniquement) <span className="required">*</span>
                </label>
                <input
                  id="dateRdv"
                  type="date"
                  min={todayStr}
                  value={dateRdv}
                  onChange={(event) => handleDateChange(event.target.value)}
                  disabled={isSaving}
                />
                {errors.dateRdv && <span className="error-message">{errors.dateRdv}</span>}
              </div>

              <div className={`form-group ${errors.heureRdv ? 'form-group--error' : ''}`}>
                <div className="time-picker-container">
                  <div className="select-wrapper">
                    <label htmlFor="heureRdvSelect">
                      Créneaux <span className="required">*</span>
                    </label>
                    <Select<RendezVousTimeOption, false>
                      inputId="heureRdvSelect"
                      options={timeSlots}
                      value={heureRdv}
                      onChange={handleSelectHeureChange}
                      styles={selectStyles}
                      isDisabled={isSaving}
                      placeholder="Choisir..."
                      isClearable
                    />
                  </div>

                  <div className="manual-time-wrapper">
                    <label>Saisie Manuelle</label>
                    <div className="inputs-row">
                      <input
                        type="text"
                        className="time-num-input"
                        placeholder="HH"
                        value={heureInput}
                        onChange={(event) => handleHeureInputChange(event.target.value)}
                        maxLength={2}
                        disabled={isSaving}
                      />
                      <span className="separator">:</span>
                      <input
                        type="text"
                        className="time-num-input"
                        placeholder="MM"
                        value={minuteInput}
                        onChange={(event) => handleMinuteInputChange(event.target.value)}
                        maxLength={2}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
                {errors.heureRdv && <span className="error-message">{errors.heureRdv}</span>}
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3 className="form-card__title">2. Interlocuteur & Coordonnées directes</h3>
            <div className="form-row">
              <div className={`form-group ${errors.interlocuteurNom ? 'form-group--error' : ''}`}>
                <label htmlFor="interlocuteurNom">
                  Nom complet <span className="required">*</span>
                </label>
                <input
                  id="interlocuteurNom"
                  type="text"
                  value={interlocuteurNom}
                  onChange={(event) => handleInterlocuteurNomChange(event.target.value)}
                  placeholder="M. Jean Dupont"
                  disabled={isSaving}
                />
                {errors.interlocuteurNom && <span className="error-message">{errors.interlocuteurNom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="interlocuteurRole">Fonction / Rôle</label>
                <input
                  id="interlocuteurRole"
                  type="text"
                  value={interlocuteurRole}
                  onChange={(event) => setInterlocuteurRole(event.target.value)}
                  placeholder="Ex: Directeur Général"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '4px' }}>
              <div className={`form-group ${errors.telephone ? 'form-group--error' : ''}`}>
                <label htmlFor="telephone">
                  Téléphone de contact <span className="required">*</span>
                </label>
                <input
                  id="telephone"
                  type="tel"
                  value={telephone}
                  onChange={(event) => handleTelephoneChange(event.target.value)}
                  placeholder="Ex: 0612345678"
                  disabled={isSaving}
                />
                {errors.telephone && <span className="error-message">{errors.telephone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email de contact</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Ex: j.dupont@entreprise.fr"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3 className="form-card__title">3. Notes de qualification</h3>
            <div className="form-group">
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Saisissez ici les informations de qualification recueillies lors de l'échange..."
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="prise-rdv-form__actions">
            <button type="submit" className="btn-submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="spinner"></span> Enregistrement...
                </>
              ) : (
                'Valider la mise en relation'
              )}
            </button>
          </div>
        </form>
      </section>

      <RendezVousRecapModal
        isOpen={isRecapOpen}
        recap={recap}
        onClose={handleRecapClose}
      />
    </>
  );
}
