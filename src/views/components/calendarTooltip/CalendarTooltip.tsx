import './calendarTooltip.scss';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatProspectName, checkIsCommande, checkIsRelanceVente, checkIsRendezVousPris, checkIsRelance, getProspectRelationBadge } from '../../../utils/scripts/index.ts';
import type { CalendarEvent } from '../../../utils/types/index.ts';
import { RENDEZ_VOUS_KIND_COLORS } from '../../../utils/constants/index.ts';

interface CalendarTooltipProps {
  event: CalendarEvent;
  x: number;
  y: number;
}

const STATUT_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  effectue: 'Effectué',
  reporte: 'Reporté',
  annule: 'Annulé',
};

const STATUT_COLORS: Record<string, string> = {
  planifie: '#3b82f6',
  effectue: '#3b82f6',
  reporte: '#3b82f6',
  annule: '#6b7280',
  non_honore: '#6b7280',
};

export default function CalendarTooltip({ event, x, y }: CalendarTooltipProps) {
  const { resource, eventType } = event;
  const isOtherAgent = eventType === 'other-agent-prospect';

  const dateLabel = format(parseISO(resource.date_rdv), 'EEE d MMM yyyy', { locale: fr });
  const timeLabel = resource.heure_rdv.substring(0, 5);
  const prospectName = resource.prospect ? formatProspectName(resource.prospect) : null;
  const maturityBadge = getProspectRelationBadge(resource.prospect?.relation_commerciale_campagne?.statut_relation);

  const left = x + 228 > window.innerWidth ? x - 228 - 8 : x + 12;
  const top  = y + 8;

  const isRelanceVente = checkIsRelanceVente(resource.motif, resource.appelsSource);
  const isCommande = !isRelanceVente && checkIsCommande(resource.motif, resource.appelsSource);
  const isRendezVousPris = !isRelanceVente && !isCommande && checkIsRendezVousPris(resource.motif, resource.appelsSource);
  const isRelance = !isRelanceVente && !isCommande && !isRendezVousPris && checkIsRelance(resource.motif, resource.appelsSource);

  let headerColor = STATUT_COLORS[resource.statut] ?? STATUT_COLORS.planifie;
  let headerLabel = STATUT_LABELS[resource.statut] ?? resource.statut;

  if (isOtherAgent) {
    headerColor = '#d97706';
    headerLabel = 'Autre agent';
  } else if (isRelanceVente) {
    headerColor = RENDEZ_VOUS_KIND_COLORS.relanceVente;
    headerLabel = 'Relance';
  } else if (isCommande) {
    headerColor = RENDEZ_VOUS_KIND_COLORS.commande;
    headerLabel = 'Commande à établir';
  } else if (isRendezVousPris) {
    headerColor = RENDEZ_VOUS_KIND_COLORS.rendezVousPris;
    headerLabel = 'Rendez-vous pris';
  } else if (isRelance) {
    headerColor = RENDEZ_VOUS_KIND_COLORS.relance;
    headerLabel = 'Relance';
  }

  const textColor = isRendezVousPris && !isOtherAgent ? '#0f172a' : 'white';

  return (
    <div className="cal-tooltip" style={{ left, top }}>
      <div className="cal-tooltip__header">
        <span
          className="cal-tooltip__statut"
          style={{ backgroundColor: headerColor, color: textColor }}
        >
          {headerLabel}
        </span>
        {isOtherAgent && prospectName && (
          <span className="cal-tooltip__prospect">{prospectName}</span>
        )}
      </div>

      {!isOtherAgent && prospectName && (
        <div className="cal-tooltip__prospect">{prospectName}</div>
      )}

      {resource.prospect && (
        <span className="cal-tooltip__maturity" data-relation={maturityBadge.variant}>
          {maturityBadge.label}
        </span>
      )}

      <div className="cal-tooltip__time">
        {dateLabel} · {timeLabel}
      </div>

      {resource.motif && (
        <div className="cal-tooltip__motif">{resource.motif}</div>
      )}

      {resource.derniere_note_closing && (
        <div className="cal-tooltip__notes">{resource.derniere_note_closing}</div>
      )}
    </div>
  );
}
