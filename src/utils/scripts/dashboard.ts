import type { ProspectAssigne, RendezVous } from '../types/index.ts';
import {
  checkIsCommande,
  checkIsRelanceVente,
  checkIsRendezVousPris,
  checkIsRelance,
  formatHeure,
  formatProspectName,
} from './formatters.ts';

export interface DashboardRendezVousItem {
  rendezVous: RendezVous;
  prospectLabel: string;
  heureLabel: string;
  isNext: boolean;
  isCommande: boolean;
  isRelanceVente: boolean;
  isRendezVousPris: boolean;
  isRelance: boolean;
  url: string | null;
}

export interface DashboardAssignedProspectAction {
  url: string;
  shouldStartCall: boolean;
}

export function buildDashboardRappelUrl(rendezVous: RendezVous): string | null {
  if (!rendezVous.prospect?.id_prospect) return null;
  return `/prospect/${rendezVous.prospect.id_prospect}?source=rappel&rdvId=${rendezVous.id_rendez_vous}`;
}

export function buildAssignedProspectUrl(
  idProspect: number,
  rendezVousSourceId?: number | null,
): string {
  if (!rendezVousSourceId) {
    return `/prospect/${idProspect}`;
  }

  const params = new URLSearchParams({
    source: 'rappel',
    rdvId: String(rendezVousSourceId),
    autoReminder: '1',
  });

  return `/prospect/${idProspect}?${params.toString()}`;
}

export function resolveAssignedProspectAction(
  idProspect: number,
  distributionMode: ProspectAssigne['distribution_mode'],
  rendezVousSourceId?: number | null,
): DashboardAssignedProspectAction {
  return {
    url: buildAssignedProspectUrl(idProspect, rendezVousSourceId),
    shouldStartCall: distributionMode !== 'rappel',
  };
}

function getMinutesFromTime(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return (Number.parseInt(hours, 10) || 0) * 60 + (Number.parseInt(minutes, 10) || 0);
}

function getNextRendezVousId(rendezVous: RendezVous[], now: Date): number | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = rendezVous
    .map((item) => ({
      id: item.id_rendez_vous,
      minutes: getMinutesFromTime(item.heure_rdv),
    }))
    .sort((left, right) => left.minutes - right.minutes)
    .find((item) => item.minutes >= currentMinutes);

  return upcoming?.id ?? null;
}

function getProspectLabel(rendezVous: RendezVous): string {
  if (!rendezVous.prospect) return 'Prospect inconnu';
  return formatProspectName({
    nom: rendezVous.prospect.nom,
    prenom: rendezVous.prospect.prenom,
  });
}

export function buildDashboardRendezVousItems(
  rendezVous: RendezVous[],
  now: Date = new Date(),
): DashboardRendezVousItem[] {
  const nextRendezVousId = getNextRendezVousId(rendezVous, now);

  return rendezVous.map((item) => {
    const isRelanceVente = checkIsRelanceVente(item.motif, item.appelsSource);
    const isCommande = !isRelanceVente && checkIsCommande(item.motif, item.appelsSource);
    const isRendezVousPris = !isRelanceVente && !isCommande && checkIsRendezVousPris(item.motif, item.appelsSource);
    const isRelance = !isRelanceVente && !isCommande && !isRendezVousPris && checkIsRelance(item.motif, item.appelsSource);

    return {
      rendezVous: item,
      prospectLabel: getProspectLabel(item),
      heureLabel: formatHeure(item.heure_rdv),
      isNext: item.id_rendez_vous === nextRendezVousId,
      isCommande,
      isRelanceVente,
      isRendezVousPris,
      isRelance,
      url: buildDashboardRappelUrl(item),
    };
  });
}
