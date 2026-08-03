import './agentCalendar.scss';
import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTrash, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import type { CalendarEvent, RendezVousStatut, StatutAppel } from '../../../utils/types/index.ts';
import { CALENDAR_MESSAGES, RENDEZ_VOUS_KIND_COLORS, STATUT_RENDEZ_VOUS_COLORS } from '../../../utils/constants/index.ts';
import type { CampaignVariant } from '../../../utils/scripts/index.ts';
import { formatHeure, checkIsCommande, checkIsRelanceVente, checkIsRendezVousPris, checkIsRelance, getCampaignAgendaRendezVousMotif } from '../../../utils/scripts/index.ts';
import { Loader } from '../loader/index.ts';
import { CalendarTooltip } from '../calendarTooltip/index.ts';
import { RendezVousDetailsModal } from '../rendezVousDetailsModal/index.ts';
import { RendezVousModal } from '../rendezVousModal/index.ts';
import { ConfirmModal } from '../confirmModal/index.ts';
import { createPortal } from 'react-dom';
import { useAgentCalendar } from '../../../hooks/index.ts';

const locales = { 'fr': fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// eventStyleGetter is now declared inside the component using useCallback

interface AgentCalendarProps {
  prospectId?: number;
  prospectName?: string;
  campagneId?: number;
  campaignVariant?: CampaignVariant | null;
  isReadOnly?: boolean;
  selectedCallStatus?: StatutAppel | null;
}

export default function AgentCalendar({
  prospectId = undefined,
  prospectName = undefined,
  campagneId = undefined,
  campaignVariant = null,
  isReadOnly = false,
  selectedCallStatus = null,
}: AgentCalendarProps) {
  const {
    events,
    isLoading,
    myProspectRdvs,
    otherAgentRdvList,
    nextMyProspectRdv,
    resolvedCampagneId,
    canSelectSlot,
    createRendezVous,
    updateRendezVous,
    deleteRendezVous,
  } = useAgentCalendar(prospectId, campagneId ?? null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('week');
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; event: CalendarEvent | null }>({
    visible: false, x: 0, y: 0, event: null,
  });
  const [selectedRendezVous, setSelectedRendezVous] = useState<CalendarEvent['resource'] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ event: CalendarEvent | null }>({ event: null });

  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((view: View) => setCurrentView(view), []);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { statut, motif, appelsSource } = event.resource;
    const { eventType } = event;

    if (eventType === 'other-agent-prospect') {
      return {
        style: {
          backgroundColor: '#d97706',
          borderRadius: '0.375rem',
          border: 'none',
          color: 'white',
          opacity: 0.9,
          fontStyle: 'italic',
        },
        className: 'event event--other-agent',
      };
    }

    const selectedStatusForEvent =
      eventType === 'mine-prospect' &&
      (!resolvedCampagneId || event.resource.id_campagne === resolvedCampagneId)
        ? selectedCallStatus
        : null;
    const isRelanceVente = checkIsRelanceVente(motif, appelsSource, selectedStatusForEvent);
    const isCommande = !isRelanceVente && checkIsCommande(motif, appelsSource, selectedStatusForEvent);
    const isRendezVousPris = !isRelanceVente && !isCommande && checkIsRendezVousPris(motif, appelsSource, selectedStatusForEvent);
    const isRelance = !isRelanceVente && !isCommande && !isRendezVousPris && checkIsRelance(motif, appelsSource, selectedStatusForEvent);

    let color = STATUT_RENDEZ_VOUS_COLORS[statut] ?? STATUT_RENDEZ_VOUS_COLORS.planifie;
    if (isRelanceVente) {
      color = RENDEZ_VOUS_KIND_COLORS.relanceVente;
    } else if (isCommande) {
      color = RENDEZ_VOUS_KIND_COLORS.commande;
    } else if (isRendezVousPris) {
      color = RENDEZ_VOUS_KIND_COLORS.rendezVousPris;
    } else if (isRelance) {
      color = RENDEZ_VOUS_KIND_COLORS.relance;
    }

    const textColor = isRendezVousPris ? '#0f172a' : 'white';
    const isSpecialKind = isCommande || isRelanceVente || isRendezVousPris || isRelance;

    if (eventType === 'mine-prospect') {
      return {
        style: {
          backgroundColor: color,
          borderRadius: '0.375rem',
          border: 'none',
          boxShadow: `inset 0 0 0 2px white, 0 0 0 2px ${color}`,
          color: textColor,
          fontWeight: 600,
        },
        className: `event event--${statut} event--mine-prospect${isCommande ? ' event--commande' : ''}${isRelanceVente ? ' event--relance-vente' : ''}${isRendezVousPris ? ' event--rendez-vous-pris' : ''}${isRelance ? ' event--relance' : ''}`,
      };
    }

    return {
      style: {
        backgroundColor: color,
        borderRadius: '0.375rem',
        border: 'none',
        color: textColor,
        opacity: statut === 'annule' ? 0.35 : (isSpecialKind ? 0.9 : 0.65),
        fontWeight: (statut === 'planifie' || isSpecialKind) ? 600 : 400,
      },
      className: `event event--${statut} event--mine-other${isCommande ? ' event--commande' : ''}${isRelanceVente ? ' event--relance-vente' : ''}${isRendezVousPris ? ' event--rendez-vous-pris' : ''}${isRelance ? ' event--relance' : ''}`,
    };
  }, [resolvedCampagneId, selectedCallStatus]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedRendezVous(event.resource);
    setIsDetailsModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: SlotInfo) => {
    if (!canSelectSlot(start, isReadOnly)) return;
    setSelectedSlot({ start, end });
    setSelectedRendezVous(null);
    setIsRdvModalOpen(true);
  }, [canSelectSlot, isReadOnly]);

  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedRendezVous(null);
  }, []);

  const handleEditRendezVous = useCallback(() => {
    setIsDetailsModalOpen(false);
    setIsRdvModalOpen(true);
  }, []);

  const handleCloseRdvModal = useCallback(() => {
    setIsRdvModalOpen(false);
    setSelectedSlot(null);
  }, []);

  const handleCreateRendezVous = useCallback(async (data: { date: Date }) => {
    const motif = getCampaignAgendaRendezVousMotif(campaignVariant, selectedCallStatus);
    if (await createRendezVous(data.date, motif)) {
      setIsRdvModalOpen(false);
      setSelectedSlot(null);
      setCalendarKey(prev => prev + 1);
    }
  }, [campaignVariant, createRendezVous, selectedCallStatus]);

  const handleUpdateRendezVous = useCallback(async (data: { date: Date; statut: RendezVousStatut }) => {
    if (!selectedRendezVous) return;
    if (await updateRendezVous(selectedRendezVous.id_rendez_vous, data.date, data.statut)) {
      setIsRdvModalOpen(false);
      setIsDetailsModalOpen(false);
      setSelectedRendezVous(null);
      setCalendarKey(prev => prev + 1);
    }
  }, [selectedRendezVous, updateRendezVous]);

  const handleDeleteRendezVous = useCallback(async () => {
    if (!selectedRendezVous) return;
    if (await deleteRendezVous(selectedRendezVous.id_rendez_vous)) {
      setIsDetailsModalOpen(false);
      setSelectedRendezVous(null);
      setCalendarKey(prev => prev + 1);
    }
  }, [deleteRendezVous, selectedRendezVous]);

  const handleQuickDelete = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche l'ouverture du modal de détails
    if (checkIsRelanceVente(event.resource.motif, event.resource.appelsSource)) {
      return;
    }
    setConfirmDelete({ event });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.event) return;
    if (await deleteRendezVous(confirmDelete.event.resource.id_rendez_vous)) {
      setConfirmDelete({ event: null });
      setCalendarKey(prev => prev + 1);
    }
  }, [confirmDelete, deleteRendezVous]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete({ event: null });
  }, []);

  const CustomEventComponent = useMemo(() => {
    return function CustomEvent({ event }: { event: CalendarEvent }) {
      const isLockedEvent = isReadOnly || checkIsRelanceVente(event.resource.motif, event.resource.appelsSource);
      return (
        <div className="cal-event-wrapper">
          <div
            className="cal-event-content"
            onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, event })}
            onMouseMove={(e) => setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }))}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          >
            {event.title}
          </div>
          {!isLockedEvent && (
            <button
              className="cal-event-delete-btn"
              onClick={(e) => handleQuickDelete(event, e)}
              title="Supprimer ce rendez-vous"
            >
              <FaTrash />
            </button>
          )}
        </div>
      );
    };
  }, [handleQuickDelete, isReadOnly]);

  if (isLoading) {
    return (
      <div className="agent-calendar__loading">
        <Loader size="medium" />
        <p>Chargement du calendrier...</p>
      </div>
    );
  }

  return (
    <div className="agent-calendar">
      {/* Bannières d'information spécifique au prospect */}
      {prospectId && myProspectRdvs.length > 0 && (
        <div className="agent-calendar__prospect-banner">
          <FaUser className="agent-calendar__prospect-banner-icon" />
          <span>
            <strong>{prospectName || 'Prospect'}</strong> —{' '}
            {myProspectRdvs.length} RDV{myProspectRdvs.length > 1 ? 's' : ''} existant{myProspectRdvs.length > 1 ? 's' : ''}
          </span>
          {nextMyProspectRdv && (
            <span className="agent-calendar__prospect-banner-next">
              · Prochain le{' '}
              {format(parseISO(nextMyProspectRdv.date_rdv), 'EEE d MMM', { locale: fr })}{' '}
              à {formatHeure(nextMyProspectRdv.heure_rdv)}
            </span>
          )}
        </div>
      )}

      {prospectId && otherAgentRdvList.length > 0 && (
        <div className="agent-calendar__prospect-banner agent-calendar__prospect-banner--warning">
          <FaExclamationTriangle className="agent-calendar__prospect-banner-icon" />
          <span>
            {otherAgentRdvList.length} RDV{otherAgentRdvList.length > 1 ? 's' : ''} pris avec ce prospect par un autre agent
          </span>
        </div>
      )}

      <div className="agent-calendar__calendar-wrapper">
        <Calendar
          key={calendarKey}
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ flex: 1, minHeight: 0 }}
          messages={CALENDAR_MESSAGES}
          culture="fr"
          view={currentView}
          onView={handleViewChange}
          views={['month', 'week', 'day']}
          date={currentDate}
          onNavigate={handleNavigate}
          min={new Date(1970, 0, 1, 8, 0)}
          max={new Date(1970, 0, 1, 19, 0)}
          step={15}
          timeslots={4}
          selectable={!isReadOnly && !!prospectId}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{ event: CustomEventComponent }}
        />
      </div>

      {tooltip.visible && tooltip.event && createPortal(
        <CalendarTooltip event={tooltip.event} x={tooltip.x} y={tooltip.y} />,
        document.body
      )}

      <RendezVousDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        rendezVous={selectedRendezVous}
        onEdit={handleEditRendezVous}
        onDelete={handleDeleteRendezVous}
        showMonterFiche={!prospectId}
        isReadOnly={isReadOnly}
      />

      {isRdvModalOpen && (
        <RendezVousModal
          isOpen={isRdvModalOpen}
          onClose={handleCloseRdvModal}
          rendezVous={selectedRendezVous}
          initialDate={selectedSlot?.start}
          prospectName={prospectName || undefined}
          isReadOnly={isReadOnly}
          onCreate={handleCreateRendezVous}
          onUpdate={handleUpdateRendezVous}
          onRequestDelete={() => {
            if (selectedRendezVous) {
              const tempEvent: CalendarEvent = {
                id: selectedRendezVous.id_rendez_vous,
                title: `${prospectName || 'Prospect'} — ${selectedRendezVous.motif || 'Rendez-vous'}`,
                start: new Date(),
                end: new Date(),
                resource: selectedRendezVous,
                eventType: 'mine-prospect',
              };
              setConfirmDelete({ event: tempEvent });
              setIsRdvModalOpen(false);
            }
          }}
        />
      )}

      {confirmDelete.event && (
        <ConfirmModal
          isOpen={!!confirmDelete.event}
          title="Supprimer le rendez-vous"
          message={`Êtes-vous sûr de vouloir supprimer le rendez-vous « ${confirmDelete.event.title} » ?`}
          type="danger"
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
