import './dashboardPage.scss';
import { useDashboardPage } from '../../../hooks/index.ts';
import { CalendarModal, SalesGauge } from '../../components/index.ts';
import { FaCalendarAlt } from 'react-icons/fa';

const PROGPA_STEP_DEFS: Array<{
  progpa: number | '5+';
  defaultLabel: string;
  color: string;
  isFollowup?: boolean;
}> = [
  { progpa: 1, defaultLabel: 'Identification', color: '#7c3aed' },
  { progpa: 2, defaultLabel: 'Présentation', color: '#2563eb' },
  { progpa: 3, defaultLabel: 'Découverte', color: '#0891b2' },
  { progpa: 4, defaultLabel: 'Proposition', color: '#f59e0b' },
  { progpa: 5, defaultLabel: 'Commande', color: '#16a34a' },
  { progpa: '5+', defaultLabel: 'Suivi de commande', color: '#c026d3', isFollowup: true },
];

export default function DashboardPage() {
  const {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchError,
    rendezVousItems,
    rdvLoading,
    stats,
    statsLoading,
    handleSearch,
    isCalendarModalOpen,
    openCalendar,
    closeCalendar,
    openRendezVous,
    openTestProspect,
    nextRendezVousRef,
    isOpeningTestProspect,
    isTestProspectDisabled,
    testProspectTitle,
  } = useDashboardPage();

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
            {rendezVousItems.length > 0 && <span className="dashboard__badge">{rendezVousItems.length}</span>}
          </h2>

          {rdvLoading ? (
            <p className="dashboard__loading">Chargement...</p>
          ) : rendezVousItems.length === 0 ? (
            <div className="dashboard__empty-state">
              <p>Aucun rappel prévu aujourd'hui.</p>
            </div>
          ) : (
            <ul className="dashboard__rdv-list">
              {rendezVousItems.map((item) => {
                const { rendezVous } = item;
                return (
                  <li
                    key={rendezVous.id_rendez_vous}
                    ref={item.isNext ? nextRendezVousRef : null}
                    className={`dashboard__rdv-item ${item.isNext ? 'dashboard__rdv-item--next' : ''} ${item.isCommande ? 'dashboard__rdv-item--commande' : ''} ${item.isRelanceVente ? 'dashboard__rdv-item--relance-vente' : ''} ${item.isRendezVousPris ? 'dashboard__rdv-item--rdv-pris' : ''} ${item.isRelance ? 'dashboard__rdv-item--relance' : ''}`}
                    onClick={() => openRendezVous(item.url)}
                  >
                    <div className="dashboard__rdv-heure">{item.heureLabel}</div>
                    <div className="dashboard__rdv-info">
                      <span className="dashboard__rdv-nom">
                        {item.prospectLabel}
                        {item.isCommande && (
                          <span className="dashboard__rdv-badge-commande">Commande à établir</span>
                        )}
                        {item.isRelanceVente && (
                          <span className="dashboard__rdv-badge-relance">Relance</span>
                        )}
                        {item.isRendezVousPris && (
                          <span className="dashboard__rdv-badge-rdv-pris">Rendez-vous pris</span>
                        )}
                        {item.isRelance && (
                          <span className="dashboard__rdv-badge-relance">Relance</span>
                        )}
                      </span>
                      {rendezVous.prospect?.telephone && (
                        <span className="dashboard__rdv-tel">{rendezVous.prospect.telephone}</span>
                      )}
                      {rendezVous.motif && <span className="dashboard__rdv-motif">{rendezVous.motif}</span>}
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
            onClick={openCalendar}
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
          <div className="dashboard__progpa-grid">
            <article className="dashboard__progpa-card dashboard__progpa-card--appels">
              <div className="dashboard__progpa-content">
                <div className="dashboard__progpa-header">
                  <strong className="dashboard__progpa-count">{stats.appels_total}</strong>
                  <span className="dashboard__progpa-label">Appels</span>
                </div>
                <small className="dashboard__progpa-percent">aujourd'hui</small>
              </div>
            </article>
            {PROGPA_STEP_DEFS.map((def) => {
              const apiStep = stats.progpa_etapes?.find((s) => String(s.progpa) === String(def.progpa));
              const count = apiStep ? apiStep.count : 0;
              const pourcentage = apiStep ? apiStep.pourcentage : 0;
              const label = apiStep?.label || def.defaultLabel;

              return (
                <article
                  key={String(def.progpa)}
                  className={`dashboard__progpa-card ${def.isFollowup ? 'dashboard__progpa-card--followup' : ''}`}
                  title={label}
                  style={{ '--step-color': def.color } as React.CSSProperties}
                >
                  <span className="dashboard__progpa-index">{def.progpa}</span>
                  <div className="dashboard__progpa-content">
                    <div className="dashboard__progpa-header">
                      <strong className="dashboard__progpa-count">{count}</strong>
                      <span className="dashboard__progpa-label" title={label}>{label}</span>
                    </div>
                    <small className="dashboard__progpa-percent">{pourcentage.toFixed(1)} %</small>
                  </div>
                </article>
              );
            })}
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
        onClick={openTestProspect}
        disabled={isTestProspectDisabled}
        title={testProspectTitle}
      >
        {isOpeningTestProspect ? 'Ouverture...' : 'Utilisateur TEST'}
      </button>

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={closeCalendar}
      />
    </main>
  );
}
