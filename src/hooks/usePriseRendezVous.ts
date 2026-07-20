import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { closingService, leadService } from '../API/services/index.ts';
import { useApp, useCampaign, useDialer, useProspect, useToast } from './index.ts';
import { getCampaignVariant } from '../utils/scripts/campaignVariants.ts';
import { formatProspectName, getErrorMessage } from '../utils/scripts/formatters.ts';
import {
  buildLeadB2BRendezVousPayload,
  formatLeadB2BDateLabel,
  getLeadB2BRendezVousPrefill,
  getLeadB2BTimeSlots,
  getTodayInputDateString,
  isLeadB2BDateAllowed,
} from '../utils/scripts/priseRendezVous.ts';
import type { RendezVousRecapData, RendezVousTimeOption } from '../utils/types/index.ts';

const TIME_SLOTS = getLeadB2BTimeSlots();

type FormErrors = Record<string, string>;

export function usePriseRendezVous() {
  const { currentProspect, loadRendezVous } = useProspect();
  const { currentCampaign } = useCampaign();
  const { setView } = useApp();
  const {
    currentAppelId,
    currentOrigineAppel,
    currentRendezVousSourceId,
    callDuration,
  } = useDialer();
  const { showToast } = useToast();

  const [dateRdv, setDateRdv] = useState('');
  const [heureRdv, setHeureRdv] = useState<RendezVousTimeOption | null>(null);
  const [heureInput, setHeureInput] = useState('');
  const [minuteInput, setMinuteInput] = useState('');
  const [interlocuteurNom, setInterlocuteurNom] = useState('');
  const [interlocuteurRole, setInterlocuteurRole] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [recap, setRecap] = useState<RendezVousRecapData | null>(null);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  useEffect(() => {
    if (!currentProspect) return;
    const prefill = getLeadB2BRendezVousPrefill(currentProspect);

    queueMicrotask(() => {
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
    });
  }, [currentProspect]);

  const handleDateChange = (value: string): void => {
    setDateRdv(value);
    setErrors((previous) => ({
      ...previous,
      dateRdv: value && !isLeadB2BDateAllowed(value)
        ? 'Seuls les mardis et jeudis sont ouverts.'
        : '',
    }));
  };

  const handleSelectHeureChange = (option: RendezVousTimeOption | null): void => {
    setHeureRdv(option);
    if (option) {
      const [hours, minutes] = option.value.split(':');
      setHeureInput(hours);
      setMinuteInput(minutes);
    } else {
      setHeureInput('');
      setMinuteInput('');
    }
    setErrors((previous) => ({ ...previous, heureRdv: '' }));
  };

  const updateHeureRdvFromInputs = (hours: string, minutes: string): void => {
    setErrors((previous) => ({ ...previous, heureRdv: '' }));
    if (!hours || !minutes) {
      setHeureRdv(null);
      return;
    }

    const timeValue = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    setHeureRdv(
      TIME_SLOTS.find((slot) => slot.value === timeValue)
      ?? { value: timeValue, label: timeValue },
    );
  };

  const normalizeTimePart = (value: string, maximum: number): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return String(Math.min(Number.parseInt(digits, 10), maximum));
  };

  const handleHeureInputChange = (value: string): void => {
    const hours = normalizeTimePart(value, 23);
    setHeureInput(hours);
    updateHeureRdvFromInputs(hours, minuteInput);
  };

  const handleMinuteInputChange = (value: string): void => {
    const minutes = normalizeTimePart(value, 59);
    setMinuteInput(minutes);
    updateHeureRdvFromInputs(heureInput, minutes);
  };

  const handleInterlocuteurNomChange = (value: string): void => {
    setInterlocuteurNom(value);
    setErrors((previous) => ({ ...previous, interlocuteurNom: '' }));
  };

  const handleTelephoneChange = (value: string): void => {
    setTelephone(value);
    setErrors((previous) => ({ ...previous, telephone: '' }));
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!dateRdv) nextErrors.dateRdv = 'La date est obligatoire.';
    else if (!isLeadB2BDateAllowed(dateRdv)) nextErrors.dateRdv = 'Seuls les mardis et jeudis sont ouverts.';
    if (!heureRdv && (!heureInput || !minuteInput)) nextErrors.heureRdv = "L'heure est obligatoire.";
    if (!interlocuteurNom.trim()) nextErrors.interlocuteurNom = 'Le nom est obligatoire.';
    if (!telephone.trim()) nextErrors.telephone = 'Le téléphone est obligatoire.';
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!currentProspect) {
      showToast('error', 'Aucun prospect charge pour cette fiche.');
      return;
    }
    if (!currentCampaign?.id_campagne) {
      showToast('error', 'Impossible d enregistrer un rendez-vous sans campagne active.');
      return;
    }

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showToast('error', 'Veuillez renseigner correctement le formulaire.');
      return;
    }

    const timeValue = heureRdv?.value
      ?? `${heureInput.padStart(2, '0')}:${minuteInput.padStart(2, '0')}`;
    setErrors({});
    setIsSaving(true);

    try {
      const recapData: RendezVousRecapData = {
        prospectLabel: formatProspectName(currentProspect),
        campaignLabel: currentCampaign.nom_campagne,
        dateLabel: formatLeadB2BDateLabel(dateRdv),
        heure: timeValue,
        interlocuteurNom: interlocuteurNom.trim(),
        interlocuteurRole: interlocuteurRole.trim(),
        telephone: telephone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      };

      await leadService.createLead(buildLeadB2BRendezVousPayload({
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
      }));

      setRecap(recapData);
      setIsRecapOpen(true);
      void loadRendezVous();
    } catch (saveError) {
      showToast('error', getErrorMessage(saveError, 'Erreur lors de l enregistrement du rendez-vous'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecapClose = (): void => {
    setIsRecapOpen(false);
    setView('historique-rendez-vous');

    if (!currentProspect || !currentCampaign || closingService.hasPending()) return;
    closingService.savePending({
      prospectId: currentProspect.id_prospect,
      prospectName: formatProspectName(currentProspect),
      campagneId: currentCampaign.id_campagne,
      campaignVariant: getCampaignVariant(currentCampaign),
      appelId: currentAppelId ?? undefined,
      origineAppel: currentOrigineAppel ?? undefined,
      rendezVousSourceId: currentRendezVousSourceId ?? undefined,
      dureeAppel: callDuration,
    });
  };

  return {
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
    todayStr: getTodayInputDateString(),
    timeSlots: TIME_SLOTS,
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
  };
}
