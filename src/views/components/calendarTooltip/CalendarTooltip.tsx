import './calendarTooltip.scss';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatProspectName, checkIsCommande, checkIsRelanceVente } from '../../../utils/scripts/formatters';
import type { CalendarEvent } from '../../../utils/types';
import { RENDEZ_VOUS_KIND_COLORS } from '../../../utils/constants';

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

  const left = x + 228 > window.innerWidth ? x - 228 - 8 : x + 12;
  const top  = y + 8;

  const isCommande = checkIsCommande(resource.motif, resource.appelsSource);
  const isRelanceVente = checkIsRelanceVente(resource.motif, resource.appelsSource);
  const headerColor = isOtherAgent
    ? '#d97706'
    : (isRelanceVente
      ? RENDEZ_VOUS_KIND_COLORS.relanceVente
      : (isCommande ? RENDEZ_VOUS_KIND_COLORS.commande : (STATUT_COLORS[resource.statut] ?? STATUT_COLORS.planifie)));
  const headerLabel = isOtherAgent
    ? 'Autre agent'
    : (isRelanceVente ? 'Relance vente' : (isCommande ? 'Commande à établir' : (STATUT_LABELS[resource.statut] ?? resource.statut)));

  return (
    <div className="cal-tooltip" style={{ left, top }}>
      <div className="cal-tooltip__header">
        <span
          className="cal-tooltip__statut"
          style={{ backgroundColor: headerColor }}
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
