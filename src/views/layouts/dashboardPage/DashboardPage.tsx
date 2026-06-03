import './dashboardPage.scss';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useDialer, useDashboardCalendar } from '../../../hooks';
import { useToast } from '../../../hooks';
import { formatEur, formatHeure, formatProspectName } from '../../../utils/scripts/formatters';
import type { RendezVous } from '../../../utils/types';
import SalesGauge from '../../components/salesGauge/SalesGauge';
import CalendarModal from '../../components/calendarModal/CalendarModal';
import { FaCalendarAlt } from 'react-icons/fa';

function prospectLabel(rdv: RendezVous): string {
  const p = rdv.prospect;
  if (!p) return 'Prospect inconnu';
  return formatProspectName({ nom: p.nom, prenom: p.prenom });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { prochainProspect, clearProchainProspect, call } = useDialer();
  const { showToast } = useToast();
  const networkWarningShown = useRef(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const {
    today,
    events,
    isLoading: calendarLoading,
  } = useDashboardCalendar();

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

  // Quand le contexte dialer reçoit un prospect assigné (de la queue), on ouvre sa fiche et on lance l'appel
  // IMPORTANT: Cet effet ne se déclenche que pour les appels automatiques (queue), PAS pour les recherches manuelles
  useEffect(() => {
    if (!prochainProspect) return;
    const { id_prospect, telephone, id_campagne_assignee } = prochainProspect;
    clearProchainProspect();
    // PAS de paramètre ?source=manual ici, c'est un appel automatique de la queue
    navigate(`/prospect/${id_prospect}`);
    call(telephone, id_campagne_assignee ?? undefined, id_prospect);
  }, [prochainProspect, clearProchainProspect, navigate, call]);

  const {
    searchQuery, setSearchQuery,
    isSearching, searchError,
    rdvDuJour, rdvLoading,
    stats, statsLoading,
    handleSearch,
  } = useDashboardData();

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
              {rdvDuJour.map(rdv => (
                <li key={rdv.id_rendez_vous} className="dashboard__rdv-item">
                  <div className="dashboard__rdv-heure">{formatHeure(rdv.heure_rdv)}</div>
                  <div className="dashboard__rdv-info">
                    <span className="dashboard__rdv-nom">{prospectLabel(rdv)}</span>
                    {rdv.prospect?.telephone && (
                      <span className="dashboard__rdv-tel">{rdv.prospect.telephone}</span>
                    )}
                    {rdv.motif && <span className="dashboard__rdv-motif">{rdv.motif}</span>}
                  </div>
                </li>
              ))}
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
              <span className="dashboard__stat-label">RDV pris</span>
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
          // Naviguer vers le prospect ID 1 avec le paramètre test
          navigate('/prospect/1?test=true');
        }}
      >
        Utilisateur TEST
      </button>

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        today={today}
        events={events}
        isLoading={calendarLoading}
      />
    </main>
  );
}
