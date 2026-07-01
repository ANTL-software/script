import { useState, useEffect } from 'react';
import Select from 'react-select';
import { useProspect, useApp, useToast } from '../../../hooks';
import './priseRendezVousPlaceholder.scss';

interface OptionType {
  value: string;
  label: string;
}

// Configuration des plages horaires modulables
const TIME_CONFIG = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '14:00', end: '17:00' },
  intervalMinutes: 15,
};

// Génération des créneaux horaires à partir de la configuration
function generateTimeSlots(): OptionType[] {
  const slots: OptionType[] = [];
  
  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutesTotal: number) => {
    const h = Math.floor(minutesTotal / 60);
    const m = minutesTotal % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const addRange = (startStr: string, endStr: string) => {
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

// Styles react-select compacts
const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '32px',
    height: '32px',
    background: '#f5f5f7',
    borderColor: state.isFocused ? '#7c3aed' : '#e5e5e7',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(124, 58, 237, 0.3)' : null,
    fontSize: '0.875rem',
    borderRadius: '4px',
    outline: 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#7c3aed' : '#d2d2d7',
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: '32px',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#1d1d1f',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '32px',
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  indicatorSeparator: (base: any) => ({
    ...base,
    display: 'none',
  }),
  option: (base: any, state: any) => ({
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
  menu: (base: any) => ({
    ...base,
    marginTop: '2px',
    borderRadius: '4px',
  }),
};

export default function PriseRendezVousPlaceholder() {
  const { currentProspect } = useProspect();
  const { setView } = useApp();
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

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (currentProspect) {
      setInterlocuteurNom(`${currentProspect.prenom || ''} ${currentProspect.nom}`.trim());
      setTelephone(currentProspect.telephone || '');
      setEmail(currentProspect.email || '');
      
      // Réinitialiser les états pour éviter les fuites de données d'un prospect à l'autre
      setDateRdv('');
      setHeureRdv(null);
      setHeureInput('');
      setMinuteInput('');
      setInterlocuteurRole('');
      setNotes('');
      setErrors({});
    }
  }, [currentProspect]);



  const handleDateChange = (val: string) => {
    setDateRdv(val);
    if (!val) {
      setErrors((prev) => ({ ...prev, dateRdv: '' }));
      return;
    }
    const dateObj = new Date(val);
    const day = dateObj.getDay();
    if (day !== 2 && day !== 4) { // 2 = Mardi, 4 = Jeudi
      setErrors((prev) => ({ ...prev, dateRdv: 'Seuls les mardis et jeudis sont ouverts.' }));
    } else {
      setErrors((prev) => ({ ...prev, dateRdv: '' }));
    }
  };

  const handleSelectHeureChange = (option: OptionType | null) => {
    setHeureRdv(option);
    if (option) {
      const [h, m] = option.value.split(':');
      setHeureInput(h);
      setMinuteInput(m);
    } else {
      setHeureInput('');
      setMinuteInput('');
    }
    if (errors.heureRdv) setErrors((prev) => ({ ...prev, heureRdv: '' }));
  };

  const updateHeureRdvFromInputs = (h: string, m: string) => {
    if (errors.heureRdv) setErrors((prev) => ({ ...prev, heureRdv: '' }));
    if (h && m) {
      const hFormatted = h.padStart(2, '0');
      const mFormatted = m.padStart(2, '0');
      const timeVal = `${hFormatted}:${mFormatted}`;
      
      const matchingSlot = timeSlots.find((slot) => slot.value === timeVal);
      if (matchingSlot) {
        setHeureRdv(matchingSlot);
      } else {
        setHeureRdv({ value: timeVal, label: `${timeVal}` });
      }
    } else {
      setHeureRdv(null);
    }
  };

  const handleHeureInputChange = (val: string) => {
    let num = val.replace(/\D/g, '');
    if (num) {
      const n = parseInt(num, 10);
      if (n > 23) num = '23';
    }
    setHeureInput(num);
    updateHeureRdvFromInputs(num, minuteInput);
  };

  const handleMinuteInputChange = (val: string) => {
    let num = val.replace(/\D/g, '');
    if (num) {
      const n = parseInt(num, 10);
      if (n > 59) num = '59';
    }
    setMinuteInput(num);
    updateHeureRdvFromInputs(heureInput, num);
  };

  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validation Date
    if (!dateRdv) {
      newErrors.dateRdv = 'La date est obligatoire.';
    } else {
      const dateObj = new Date(dateRdv);
      const day = dateObj.getDay();
      if (day !== 2 && day !== 4) {
        newErrors.dateRdv = 'Seuls les mardis et jeudis sont ouverts.';
      }
    }

    // Validation Heure
    if (!heureRdv && (!heureInput || !minuteInput)) {
      newErrors.heureRdv = "L'heure est obligatoire.";
    }

    if (!interlocuteurNom.trim()) newErrors.interlocuteurNom = 'Le nom est obligatoire.';
    if (!telephone.trim()) newErrors.telephone = 'Le téléphone est obligatoire.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('error', 'Veuillez renseigner correctement le formulaire.');
      return;
    }

    setErrors({});
    setIsSaving(true);

    const timeVal = heureRdv ? heureRdv.value : `${heureInput.padStart(2, '0')}:${minuteInput.padStart(2, '0')}`;

    setTimeout(() => {
      setIsSaving(false);
      showToast('success', `Rendez-vous enregistré avec succès le ${formatDateLabel(dateRdv)} à ${timeVal} !`);
      setView('historique-rendez-vous');
    }, 1200);
  };

  return (
    <section className="prise-rdv-form">
      <div className="prise-rdv-form__header">
        <h2>Prise de rendez-vous client</h2>
        <p>Formulaire de qualification et de prise de rendez-vous B2B pour le compte de notre partenaire MMA.</p>
      </div>

      <form className="prise-rdv-form__form" onSubmit={handleSubmit}>
        {/* Section 1 : Date & Heure */}
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
                onChange={(e) => handleDateChange(e.target.value)}
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
                  <Select
                    id="heureRdvSelect"
                    options={timeSlots}
                    value={heureRdv}
                    onChange={(val) => handleSelectHeureChange(val as OptionType | null)}
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
                      onChange={(e) => handleHeureInputChange(e.target.value)}
                      maxLength={2}
                      disabled={isSaving}
                    />
                    <span className="separator">:</span>
                    <input
                      type="text"
                      className="time-num-input"
                      placeholder="MM"
                      value={minuteInput}
                      onChange={(e) => handleMinuteInputChange(e.target.value)}
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

        {/* Section 2 : Interlocuteur & Coordonnées */}
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
                onChange={(e) => {
                  setInterlocuteurNom(e.target.value);
                  if (errors.interlocuteurNom) setErrors((prev) => ({ ...prev, interlocuteurNom: '' }));
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
                onChange={(e) => setInterlocuteurRole(e.target.value)}
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
                onChange={(e) => {
                  setTelephone(e.target.value);
                  if (errors.telephone) setErrors((prev) => ({ ...prev, telephone: '' }));
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: j.dupont@entreprise.fr"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Section 3 : Notes */}
        <div className="form-card">
          <h3 className="form-card__title">3. Notes de qualification</h3>
          <div className="form-group">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Saisissez ici les informations de qualification recueillies lors de l'échange..."
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Actions */}
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
  );
}
