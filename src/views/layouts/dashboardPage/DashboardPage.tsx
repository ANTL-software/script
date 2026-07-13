import './dashboardPage.scss';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useCampaign, useDialer } from '../../../hooks';
import { useToast } from '../../../hooks';
import { formatEur, formatHeure, formatProspectName, checkIsCommande, checkIsRelanceVente } from '../../../utils/scripts/formatters';
import type { RendezVous } from '../../../utils/types';
import SalesGauge from '../../components/salesGauge/SalesGauge';
import CalendarModal from '../../components/calendarModal/CalendarModal';
import { FaCalendarAlt } from 'react-icons/fa';

function prospectLabel(rdv: RendezVous): string {
  const p = rdv.prospect;
  if (!p) return 'Prospect inconnu';
  return formatProspectName({ nom: p.nom, prenom: p.prenom });
}

function getMinutesFromTimeStr(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function buildRappelUrl(rdv: RendezVous): string | null {
  if (!rdv.prospect?.id_prospect) return null;
  return `/prospect/${rdv.prospect.id_prospect}?source=rappel&rdvId=${rdv.id_rendez_vous}`;
}

function buildAssignedProspectUrl(idProspect: number, rendezVousSourceId?: number | null): string {
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { statut, prochainProspect, clearProchainProspect, call, requestNextProspect, currentCampagneId } = useDialer();
  const { loadCampaign, clearCampaign } = useCampaign();
  const { showToast } = useToast();
  const networkWarningShown = useRef(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    if (!currentCampagneId) {
      clearCampaign();
      return;
    }

    loadCampaign(currentCampagneId).catch((error: unknown) => {
      console.error('[DASHBOARD] Erreur synchronisation campagne runtime:', error);
    });
  }, [clearCampaign, currentCampagneId, loadCampaign]);

  // Vérification de la qualité de connexion réseau
  useEffect(() => {
    // Interface pour l'API Network Information (non standard)
    interface NetworkConnection {
      effectiveType?: string;
      addEventListener?(event: string, listener: () => void): void;
      removeEventListener?(event: string, listener: () => void): void;
    }

    interface NavigatorWithConnection extends Navigator {
      connection?: NetworkConnection;
      mozConnection?: NetworkConnection;
      webkitConnection?: NetworkConnection;
    }

    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!connection) return;

    const checkConnection = () => {
      const type = connection.effectiveType;
      if ((type === 'slow-2g' || type === '2g') && !networkWarningShown.current) {
        showToast('warning', 'Connexion internet faible — Qualité audio risque d\'être dégradée', 7000);
        networkWarningShown.current = true;
      } else if (type !== 'slow-2g' && type !== '2g') {
        networkWarningShown.current = false;
      }
    };

    checkConnection();
    if (connection.addEventListener) {
      connection.addEventListener('change', checkConnection);
      return () => {
        connection.removeEventListener?.('change', checkConnection);
      };
    }
  }, [showToast]);

  // Le pot commun déclenche un appel automatiquement.
  // Les rappels privés remontés par la queue ouvrent seulement la fiche,
  // pour laisser le commercial choisir le numéro comme sur un rappel manuel.
  useEffect(() => {
    if (!prochainProspect) return;
    const {
      id_prospect,
      telephone,
      id_campagne_assignee,
      distribution_mode,
      id_rendez_vous_source
    } = prochainProspect;
    clearProchainProspect();
    navigate(buildAssignedProspectUrl(id_prospect, id_rendez_vous_source));
    if (distribution_mode === 'rappel') {
      return;
    }
    call(telephone, id_campagne_assignee ?? undefined, id_prospect);
  }, [prochainProspect, clearProchainProspect, navigate, call]);

  useEffect(() => {
    if (statut !== 'disponible' || prochainProspect) {
      return;
    }

    requestNextProspect({ showEmptyToast: false }).catch(() => {});

    const intervalId = setInterval(() => {
      requestNextProspect({ showEmptyToast: false }).catch(() => {});
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [prochainProspect, requestNextProspect, statut]);

  const {
    searchQuery, setSearchQuery,
    isSearching, searchError,
    rdvDuJour, rdvLoading,
    stats, statsLoading,
    handleSearch,
  } = useDashboardData();

  // Identifier le prochain rendez-vous de la journée pour l'auto-scroll
  const nextRdv = useMemo(() => {
    if (!rdvDuJour || rdvDuJour.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const rdvWithMinutes = rdvDuJour.map(rdv => ({
      rdv,
      minutes: getMinutesFromTimeStr(rdv.heure_rdv)
    }));

    // Trier les rendez-vous par heure pour s'assurer du bon ordre
    rdvWithMinutes.sort((a, b) => a.minutes - b.minutes);

    // Trouver le premier rendez-vous dont l'heure est supérieure ou égale à l'heure actuelle
    const upcoming = rdvWithMinutes.find(item => item.minutes >= currentMinutes);

    return upcoming ? upcoming.rdv : null;
  }, [rdvDuJour]);

  const nextRdvRef = useRef<HTMLLIElement>(null);

  // Auto-scroll vers le prochain rendez-vous
  useEffect(() => {
    if (nextRdvRef.current) {
      nextRdvRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [nextRdv]);

  return (
    <main id="dashboardPage">
      <section className="dashboard__search">
        <h2 className="dashboard__section-title">Recherche manuelle</h2>
        <form onSubmit={handleSearch} className="dashboard__search-form">
          <input
            type="text"
            className="dashboard__search-input"
            placeholder="Numéro de téléphone du prospect..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
          <button type="submit" className="dashboard__search-btn" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
        {searchError && <p className="dashboard__search-error">{searchError}</p>}
      </section>

      <div className="dashboard__grid">
        <section className="dashboard__card dashboard__rdv">
          <h2 className="dashboard__section-title">
            Mes rappels du jour
            {rdvDuJour.length > 0 && <span className="dashboard__badge">{rdvDuJour.length}</span>}
          </h2>

          {rdvLoading ? (
            <p className="dashboard__loading">Chargement...</p>
          ) : rdvDuJour.length === 0 ? (
            <div className="dashboard__empty-state">
              <p>Aucun rappel prévu aujourd'hui.</p>
            </div>
          ) : (
            <ul className="dashboard__rdv-list">
              {rdvDuJour.map(rdv => {
                const isNext = nextRdv && rdv.id_rendez_vous === nextRdv.id_rendez_vous;
                const isRelanceVente = checkIsRelanceVente(rdv.motif, rdv.appelsSource);
                const isCommande = !isRelanceVente && checkIsCommande(rdv.motif, rdv.appelsSource);
                return (
                  <li
                    key={rdv.id_rendez_vous}
                    ref={isNext ? nextRdvRef : null}
                    className={`dashboard__rdv-item ${isNext ? 'dashboard__rdv-item--next' : ''} ${isCommande ? 'dashboard__rdv-item--commande' : ''} ${isRelanceVente ? 'dashboard__rdv-item--relance-vente' : ''}`}
                    onClick={() => {
                      const url = buildRappelUrl(rdv);
                      if (url) navigate(url);
                    }}
                  >
                    <div className="dashboard__rdv-heure">{formatHeure(rdv.heure_rdv)}</div>
                    <div className="dashboard__rdv-info">
                      <span className="dashboard__rdv-nom">
                        {prospectLabel(rdv)}
                        {isCommande && (
                          <span className="dashboard__rdv-badge-commande">Commande à établir</span>
                        )}
                        {isRelanceVente && (
                          <span className="dashboard__rdv-badge-relance">Relance vente conclue</span>
                        )}
                      </span>
                      {rdv.prospect?.telephone && (
                        <span className="dashboard__rdv-tel">{rdv.prospect.telephone}</span>
                      )}
                      {rdv.motif && <span className="dashboard__rdv-motif">{rdv.motif}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="dashboard__card dashboard__calendar-trigger">
          <div className="dashboard__calendar-trigger-content">
            <FaCalendarAlt className="dashboard__calendar-icon" />
            <h2 className="dashboard__section-title">Mon calendrier</h2>
            <p className="dashboard__calendar-subtitle">Consulter mes rendez-vous à venir</p>
          </div>
          <button
            className="dashboard__calendar-btn"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            Afficher le calendrier
          </button>
        </section>
      </div>

      <section className="dashboard__card dashboard__stats">
        <h2 className="dashboard__section-title">Aujourd'hui</h2>
        {statsLoading ? (
          <p className="dashboard__loading">Chargement...</p>
        ) : stats ? (
          <div className="dashboard__stats-grid">
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.appels_total}</span>
              <span className="dashboard__stat-label">Appels</span>
            </div>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.appels_aboutis}</span>
              <span className="dashboard__stat-label">Aboutis</span>
            </div>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.ventes}</span>
              <span className="dashboard__stat-label">Ventes</span>
            </div>
            <div className="dashboard__stat dashboard__stat--highlight">
              <span className="dashboard__stat-value">{formatEur(stats.ventes_jour_montant ?? 0)}</span>
              <span className="dashboard__stat-label">CA jour</span>
            </div>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.rdv_pris}</span>
              <span className="dashboard__stat-label">Cmd à établir</span>
            </div>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.rendez_vous_pris}</span>
              <span className="dashboard__stat-label">Rdv pris</span>
            </div>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{stats.taux_conversion}%</span>
              <span className="dashboard__stat-label">Conversion</span>
            </div>
          </div>
        ) : (
          <div className="dashboard__empty-state"><p>Stats indisponibles.</p></div>
        )}
      </section>

      <section className="dashboard__card dashboard__gauge">
        <h2 className="dashboard__section-title">Objectif du mois</h2>
        {statsLoading ? (
          <p className="dashboard__loading">Chargement...</p>
        ) : stats?.prime ? (
          <SalesGauge
            ventesMoisCount={stats.ventes_mois_count ?? 0}
            ventesMoisMontant={stats.ventes_mois_montant ?? 0}
            prime={stats.prime}
          />
        ) : (
          <div className="dashboard__empty-state">
            <p>Aucun niveau commercial assigné à votre profil.</p>
          </div>
        )}
      </section>

      {/* Bouton Utilisateur TEST en bas à gauche */}
      <button
        className="dashboard__test-btn"
        onClick={() => {
          if (!currentCampagneId) {
            showToast('warning', 'Chargement de votre campagne en cours. Reessayez dans un instant.');
            return;
          }

          // Le contexte dialer conserve la campagne runtime de l'agent.
          navigate('/prospect/1?test=true');
        }}
        disabled={!currentCampagneId}
        title={currentCampagneId ? 'Ouvrir la fiche de formation dans votre campagne active' : 'Chargement de la campagne active'}
      >
        Utilisateur TEST
      </button>

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </main>
  );
}
