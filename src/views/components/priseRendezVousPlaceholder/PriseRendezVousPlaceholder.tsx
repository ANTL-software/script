import { useEffect, useState } from 'react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { closingService, leadService } from '../../../API/services';
import { useApp, useCampaign, useDialer, useProspect, useToast } from '../../../hooks';
import { formatProspectName, getErrorMessage } from '../../../utils/scripts/formatters';
import { getCampaignVariant } from '../../../utils/scripts/campaignVariants';
import {
  buildLeadB2BRendezVousPayload,
  formatLeadB2BDateLabel,
  getLeadB2BRendezVousPrefill,
  getTodayInputDateString,
  isLeadB2BDateAllowed,
} from '../../../utils/scripts/priseRendezVous';
import RendezVousRecapModal, { type RendezVousRecapData } from '../rendezVousRecapModal/RendezVousRecapModal';
import './priseRendezVousPlaceholder.scss';

interface OptionType {
  value: string;
  label: string;
}

const TIME_CONFIG = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '14:00', end: '17:00' },
  intervalMinutes: 15,
};

function generateTimeSlots(): OptionType[] {
  const slots: OptionType[] = [];

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutesTotal: number): string => {
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const addRange = (startStr: string, endStr: string): void => {
    let current = parseTime(startStr);
    const end = parseTime(endStr);

    while (current <= end) {
      const formatted = formatTime(current);
      slots.push({ value: formatted, label: formatted });
      current += TIME_CONFIG.intervalMinutes;
    }
  };

  addRange(TIME_CONFIG.morning.start, TIME_CONFIG.morning.end);
  addRange(TIME_CONFIG.afternoon.start, TIME_CONFIG.afternoon.end);

  return slots;
}

const timeSlots = generateTimeSlots();

const selectStyles: StylesConfig<OptionType, false> = {
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
  const { currentProspect, loadRendezVous } = useProspect();
  const { currentCampaign } = useCampaign();
  const { setView } = useApp();
  const { currentAppelId, currentOrigineAppel, currentRendezVousSourceId, callDuration } = useDialer();
  const { showToast } = useToast();

  const [dateRdv, setDateRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState<OptionType | null>(null);
  const [heureInput, setHeureInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [interlocuteurNom, setInterlocuteurNom] = useState('');
  const [interlocuteurRole, setInterlocuteurRole] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recap, setRecap] = useState<RendezVousRecapData | null>(null);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  const todayStr = getTodayInputDateString();

  useEffect(() => {
    if (!currentProspect) {
      return;
    }

    const prefill = getLeadB2BRendezVousPrefill(currentProspect);
    setInterlocuteurNom(prefill.interlocuteurNom);
    setInterlocuteurRole(prefill.interlocuteurRole);
    setTelephone(prefill.telephone);
    setEmail(prefill.email);
    setDateRdv('');
    setHeureRdv(null);
    setHeureInput('');
    setMinuteInput('');
    setNotes('');
    setErrors({});
  }, [currentProspect]);

  const handleDateChange = (value: string): void => {
    setDateRdv(value);

    if (!value) {
      setErrors((prev) => ({ ...prev, dateRdv: '' }));
      return;
    }

    if (!isLeadB2BDateAllowed(value)) {
      setErrors((prev) => ({ ...prev, dateRdv: 'Seuls les mardis et jeudis sont ouverts.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, dateRdv: '' }));
  };

  const handleSelectHeureChange = (option: SingleValue<OptionType>): void => {
    setHeureRdv(option);

    if (option) {
      const [hours, minutes] = option.value.split(':');
      setHeureInput(hours);
      setMinuteInput(minutes);
    } else {
      setHeureInput('');
      setMinuteInput('');
    }

    if (errors.heureRdv) {
      setErrors((prev) => ({ ...prev, heureRdv: '' }));
    }
  };

  const updateHeureRdvFromInputs = (hours: string, minutes: string): void => {
    if (errors.heureRdv) {
      setErrors((prev) => ({ ...prev, heureRdv: '' }));
    }

    if (!hours || !minutes) {
      setHeureRdv(null);
      return;
    }

    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.padStart(2, '0');
    const timeValue = `${formattedHours}:${formattedMinutes}`;
    const matchingSlot = timeSlots.find((slot) => slot.value === timeValue);

    if (matchingSlot) {
      setHeureRdv(matchingSlot);
      return;
    }

    setHeureRdv({ value: timeValue, label: timeValue });
  };

  const handleHeureInputChange = (value: string): void => {
    let digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly) {
      const parsed = Number.parseInt(digitsOnly, 10);
      if (parsed > 23) {
        digitsOnly = '23';
      }
    }

    setHeureInput(digitsOnly);
    updateHeureRdvFromInputs(digitsOnly, minuteInput);
  };

  const handleMinuteInputChange = (value: string): void => {
    let digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly) {
      const parsed = Number.parseInt(digitsOnly, 10);
      if (parsed > 59) {
        digitsOnly = '59';
      }
    }

    setMinuteInput(digitsOnly);
    updateHeureRdvFromInputs(heureInput, digitsOnly);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!currentProspect) {
      showToast('error', 'Aucun prospect charge pour cette fiche.');
      return;
    }

    if (!currentCampaign?.id_campagne) {
      showToast('error', 'Impossible d enregistrer un rendez-vous sans campagne active.');
      return;
    }

    const newErrors: Record<string, string> = {};

    if (!dateRdv) {
      newErrors.dateRdv = 'La date est obligatoire.';
    } else if (!isLeadB2BDateAllowed(dateRdv)) {
      newErrors.dateRdv = 'Seuls les mardis et jeudis sont ouverts.';
    }

    if (!heureRdv && (!heureInput || !minuteInput)) {
      newErrors.heureRdv = "L'heure est obligatoire.";
    }

    if (!interlocuteurNom.trim()) {
      newErrors.interlocuteurNom = 'Le nom est obligatoire.';
    }

    if (!telephone.trim()) {
      newErrors.telephone = 'Le téléphone est obligatoire.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Veuillez renseigner correctement le formulaire.');
      return;
    }

    const timeValue = heureRdv
      ? heureRdv.value
      : `${heureInput.padStart(2, '0')}:${minuteInput.padStart(2, '0')}`;

    setErrors({});
    setIsSaving(true);

    try {
      const recapData: RendezVousRecapData = {
        prospectLabel: formatProspectName({
          nom: currentProspect.nom,
          prenom: currentProspect.prenom,
          raison_sociale: currentProspect.raison_sociale,
          type_prospect: currentProspect.type_prospect,
        }),
        campaignLabel: currentCampaign.nom_campagne,
        dateLabel: formatLeadB2BDateLabel(dateRdv),
        heure: timeValue,
        interlocuteurNom: interlocuteurNom.trim(),
        interlocuteurRole: interlocuteurRole.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      };

      await leadService.createLead(
        buildLeadB2BRendezVousPayload({
          prospectId: currentProspect.id_prospect,
          campagneId: currentCampaign.id_campagne,
          appelId: currentAppelId ?? undefined,
          dateRdv,
          timeValue,
          interlocuteurNom,
          interlocuteurRole,
          telephone,
          email,
          notes,
        })
      );

      setRecap(recapData);
      setIsRecapOpen(true);
      void loadRendezVous();
    } catch (error) {
      showToast('error', getErrorMessage(error, 'Erreur lors de l enregistrement du rendez-vous'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecapClose = (): void => {
    setIsRecapOpen(false);
    setView('historique-rendez-vous');

    if (!currentProspect || !currentCampaign || closingService.hasPending()) {
      return;
    }

    closingService.savePending({
      prospectId: currentProspect.id_prospect,
      prospectName: formatProspectName({
        nom: currentProspect.nom,
        prenom: currentProspect.prenom,
        raison_sociale: currentProspect.raison_sociale,
        type_prospect: currentProspect.type_prospect,
      }),
      campagneId: currentCampaign.id_campagne,
      campaignVariant: getCampaignVariant(currentCampaign),
      appelId: currentAppelId ?? undefined,
      origineAppel: currentOrigineAppel ?? undefined,
      rendezVousSourceId: currentRendezVousSourceId ?? undefined,
      dureeAppel: callDuration,
    });
  };

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
                    <Select<OptionType, false>
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
                  onChange={(event) => {
                    setInterlocuteurNom(event.target.value);
                    if (errors.interlocuteurNom) {
                      setErrors((prev) => ({ ...prev, interlocuteurNom: '' }));
                    }
                  }}
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
                  onChange={(event) => {
                    setTelephone(event.target.value);
                    if (errors.telephone) {
                      setErrors((prev) => ({ ...prev, telephone: '' }));
                    }
                  }}
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
