import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { closingService, leadService } from '../API/services/index.ts';
import { useApp, useCampaign, useDialer, useProspect, useToast } from './index.ts';
import { getCampaignVariant } from '../utils/scripts/campaignVariants.ts';
import { formatProspectName, getErrorMessage } from '../utils/scripts/formatters.ts';
import {
  buildLeadB2BRendezVousPayload,
  buildGoogleBookingCopyFields,
  filterAvailableLeadB2BTimeSlots,
  formatLeadB2BDateLabel,
  getLeadExternalBookingConfig,
  getLeadBookingOpenWeekdays,
  getLeadB2BRendezVousPrefill,
  getLeadB2BTimeSlots,
  getTodayInputDateString,
  isLeadB2BDateAllowed,
  isLeadB2BTimeSlotUnavailable,
  supportsMmaEmployeeCountQualification,
} from '../utils/scripts/priseRendezVous.ts';
import type { AddressSelectionResult, RendezVousRecapData, RendezVousTimeOption } from '../utils/types/index.ts';
import { buildWorkforceUpdate, capitalizeAddress, getWorkforceRange } from '../utils/scripts/index.ts';

const TIME_SLOTS = getLeadB2BTimeSlots();

type FormErrors = Record<string, string>;

export function usePriseRendezVous() {
  const { currentProspect, loadRendezVous, updateProspect } = useProspect();
  const { currentCampaign } = useCampaign();
  const { setView } = useApp();
  const {
    currentAppelId,
    currentAppelProspectId,
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
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('France');
  const [effectifMin, setEffectifMin] = useState('');
  const [effectifMax, setEffectifMax] = useState('');
  const [addressChanged, setAddressChanged] = useState(false);
  const [entreprisePlusDeCinqSalaries, setEntreprisePlusDeCinqSalaries] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [recap, setRecap] = useState<RendezVousRecapData | null>(null);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState<string[]>([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [isExternalBookingConfirmed, setIsExternalBookingConfirmed] = useState(false);

  const timeSlots = filterAvailableLeadB2BTimeSlots(TIME_SLOTS, unavailableTimeSlots);
  const showEntreprisePlusDeCinqSalaries = supportsMmaEmployeeCountQualification(currentCampaign);
  const externalBookingConfig = getLeadExternalBookingConfig(currentCampaign);
  const leadBookingOpenWeekdays = useMemo(
    () => getLeadBookingOpenWeekdays(currentCampaign),
    [currentCampaign],
  );
  const googleBookingCopyFields = useMemo(() => buildGoogleBookingCopyFields({
    prospect: currentProspect,
    interlocuteurNom,
    telephone,
    email,
  }), [currentProspect, interlocuteurNom, telephone, email]);

  const resetForm = (): void => {
    if (!currentProspect) return;
    const prefill = getLeadB2BRendezVousPrefill(currentProspect);

    setInterlocuteurNom(prefill.interlocuteurNom);
    setInterlocuteurRole(prefill.interlocuteurRole);
    setTelephone(prefill.telephone);
    setEmail(prefill.email);
    setAdresse(capitalizeAddress(currentProspect.adresse_facturation ?? ''));
    setCodePostal(currentProspect.code_postal ?? '');
    setVille(capitalizeAddress(currentProspect.ville ?? ''));
    setPays(capitalizeAddress(currentProspect.pays ?? 'France'));
    const workforce = getWorkforceRange(currentProspect);
    setEffectifMin(workforce.min);
    setEffectifMax(workforce.max);
    setAddressChanged(false);
    setEntreprisePlusDeCinqSalaries(false);
    setDateRdv('');
    setHeureRdv(null);
    setHeureInput('');
    setMinuteInput('');
    setNotes('');
    setIsExternalBookingConfirmed(false);
    setErrors({});
  };

  useEffect(() => {
    resetForm();
    // Le brouillon est local à la fiche : une mise à jour de ses données ne doit pas l'écraser.
    // Il est réinitialisé uniquement lors du passage à un autre prospect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProspect?.id_prospect]);

  useEffect(() => {
    if (
      externalBookingConfig
      || !currentCampaign?.id_campagne
      || !isLeadB2BDateAllowed(dateRdv, leadBookingOpenWeekdays)
    ) {
      setUnavailableTimeSlots([]);
      setIsAvailabilityLoading(false);
      return;
    }

    let isCurrentRequest = true;
    setIsAvailabilityLoading(true);

    leadService.getUnavailableTimeSlots(currentCampaign.id_campagne, dateRdv)
      .then((slots) => {
        if (isCurrentRequest) {
          setUnavailableTimeSlots(slots);
        }
      })
      .catch((availabilityError: unknown) => {
        if (isCurrentRequest) {
          console.error('[LEAD CLIENT] Erreur chargement disponibilites:', availabilityError);
          setUnavailableTimeSlots([]);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsAvailabilityLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [currentCampaign?.id_campagne, dateRdv, externalBookingConfig, leadBookingOpenWeekdays]);

  useEffect(() => {
    if (!heureRdv || !isLeadB2BTimeSlotUnavailable(heureRdv.value, unavailableTimeSlots)) {
      return;
    }

    setHeureRdv(null);
    setHeureInput('');
    setMinuteInput('');
    setErrors((previous) => ({
      ...previous,
      heureRdv: 'Ce créneau vient d etre réservé. Choisissez une autre heure.',
    }));
  }, [heureRdv, unavailableTimeSlots]);

  const handleDateChange = (value: string): void => {
    if (value && !isLeadB2BDateAllowed(value, leadBookingOpenWeekdays)) {
      setErrors((previous) => ({
        ...previous,
        dateRdv: 'Cette campagne ne permet pas de rendez-vous client ce jour-là.',
      }));
      return;
    }
    setDateRdv(value);
    setUnavailableTimeSlots([]);
    setErrors((previous) => ({
      ...previous,
      dateRdv: '',
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

  const handleExternalBookingTimeChange = (value: string): void => {
    setHeureInput('');
    setMinuteInput('');
    setHeureRdv(value ? { value, label: value } : null);
    setErrors((previous) => ({ ...previous, heureRdv: '' }));
  };

  const handleExternalBookingConfirmedChange = (confirmed: boolean): void => {
    setIsExternalBookingConfirmed(confirmed);
    setErrors((previous) => ({ ...previous, externalBooking: '' }));
  };

  const handleCopyGoogleBookingValue = async (value: string, label: string): Promise<void> => {
    if (!value.trim()) {
      showToast('error', `${label} n’est pas renseigné dans la fiche prospect.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast('success', `${label} copié.`);
    } catch (clipboardError: unknown) {
      console.error('[LEAD CLIENT] Erreur copie presse-papiers:', clipboardError);
      showToast('error', `Impossible de copier ${label.toLowerCase()}.`);
    }
  };

  const handleInterlocuteurNomChange = (value: string): void => {
    setInterlocuteurNom(value);
    setErrors((previous) => ({ ...previous, interlocuteurNom: '' }));
  };

  const handleTelephoneChange = (value: string): void => {
    setTelephone(value);
    setErrors((previous) => ({ ...previous, telephone: '' }));
  };

  const changeAddressField = (field: 'adresse' | 'codePostal' | 'ville' | 'pays', value: string): void => {
    setAddressChanged(true);
    ({ adresse: setAdresse, codePostal: setCodePostal, ville: setVille, pays: setPays })[field](value);
  };
  const selectAddress = (result: AddressSelectionResult): void => {
    setAdresse(result.adresse);
    setCodePostal(result.code_postal);
    setVille(result.ville);
    setPays(result.pays);
    setAddressChanged(true);
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (externalBookingConfig && !isExternalBookingConfirmed) {
      nextErrors.externalBooking = 'Confirmez que la réservation a bien été validée dans Google Agenda.';
    }
    if (!dateRdv) nextErrors.dateRdv = 'La date est obligatoire.';
    else if (!isLeadB2BDateAllowed(dateRdv, leadBookingOpenWeekdays)) {
      nextErrors.dateRdv = 'Cette campagne ne permet pas de rendez-vous client ce jour-là.';
    }
    if (!heureRdv && (!heureInput || !minuteInput)) nextErrors.heureRdv = "L'heure est obligatoire.";
    const selectedTime = heureRdv?.value
      ?? (heureInput && minuteInput ? `${heureInput.padStart(2, '0')}:${minuteInput.padStart(2, '0')}` : '');
    if (!externalBookingConfig && selectedTime && isLeadB2BTimeSlotUnavailable(selectedTime, unavailableTimeSlots)) {
      nextErrors.heureRdv = 'Ce créneau est déjà pris. Choisissez une autre heure.';
    }
    if (!interlocuteurNom.trim()) nextErrors.interlocuteurNom = 'Le nom est obligatoire.';
    if (!telephone.trim()) nextErrors.telephone = 'Le téléphone est obligatoire.';
    if ((effectifMin && (!/^\d+$/.test(effectifMin) || Number(effectifMin) > 1000000)) || (effectifMax && (!/^\d+$/.test(effectifMax) || Number(effectifMax) > 1000000))) {
      nextErrors.effectifMin = 'Les effectifs doivent être des nombres entiers.';
      nextErrors.effectifMax = 'Les effectifs doivent être des nombres entiers.';
    } else if (effectifMin && effectifMax && Number(effectifMin) > Number(effectifMax)) {
      nextErrors.effectifMax = 'Le maximum doit être supérieur ou égal au minimum.';
    }
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

      const appelId = currentAppelProspectId === currentProspect.id_prospect
        ? currentAppelId ?? undefined
        : undefined;

      const currentWorkforce = getWorkforceRange(currentProspect);
      if (effectifMin !== currentWorkforce.min || effectifMax !== currentWorkforce.max) {
        await updateProspect(buildWorkforceUpdate(effectifMin, effectifMax));
      }

      await leadService.createLead({ ...buildLeadB2BRendezVousPayload({
        prospectId: currentProspect.id_prospect,
        campagneId: currentCampaign.id_campagne,
        appelId,
        dateRdv,
        timeValue,
        interlocuteurNom,
        interlocuteurRole,
        telephone,
        email,
        notes,
        entreprisePlusDeCinqSalaries: showEntreprisePlusDeCinqSalaries
          ? entreprisePlusDeCinqSalaries
          : false,
      }), ...(addressChanged ? { adresse_prospect: {
        adresse_facturation: capitalizeAddress(adresse), code_postal: codePostal.trim(),
        ville: capitalizeAddress(ville), pays: capitalizeAddress(pays),
      } } : {}) });

      setRecap(recapData);
      setIsRecapOpen(true);
      resetForm();
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
      appelId: currentAppelProspectId === currentProspect.id_prospect
        ? currentAppelId ?? undefined
        : undefined,
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
    adresse, codePostal, ville, pays, effectifMin, effectifMax, changeAddressField, selectAddress,
    entreprisePlusDeCinqSalaries,
    showEntreprisePlusDeCinqSalaries,
    campaignLabel: currentCampaign?.nom_campagne ?? '',
    leadBookingOpenWeekdays,
    externalBookingConfig,
    googleBookingCopyFields,
    isExternalBookingConfirmed,
    notes,
    isSaving,
    errors,
    recap,
    isRecapOpen,
    todayStr: getTodayInputDateString(),
    timeSlots,
    isAvailabilityLoading,
    handleDateChange,
    handleSelectHeureChange,
    handleHeureInputChange,
    handleMinuteInputChange,
    handleExternalBookingTimeChange,
    handleExternalBookingConfirmedChange,
    handleCopyGoogleBookingValue,
    handleInterlocuteurNomChange,
    handleTelephoneChange,
    setInterlocuteurRole,
    setEmail,
    setEffectifMin,
    setEffectifMax,
    setEntreprisePlusDeCinqSalaries,
    setNotes,
    handleSubmit,
    handleRecapClose,
  };
}
