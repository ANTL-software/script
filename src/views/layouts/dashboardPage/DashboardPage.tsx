import './dashboardPage.scss';
import { useDashboardPage } from '../../../hooks/index.ts';
import { CalendarModal, SalesGauge } from '../../components/index.ts';
import { FaCalendarAlt } from 'react-icons/fa';

import { formatEur } from '../../../utils/scripts/index.ts';

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
          <div className="dashboard__stats-grid">
            <div className="dashboard__stat-card">
              <span className="dashboard__stat-card-value">{stats.appels_total}</span>
              <span className="dashboard__stat-card-label">Appels</span>
            </div>

            {stats.type_campagne === 'lead_b2b' ? (
              <div className="dashboard__stat-card dashboard__stat-card--highlight">
                <span className="dashboard__stat-card-value">{stats.leads_jour_count ?? 0}</span>
                <span className="dashboard__stat-card-label">Rendez-vous pris aujourd'hui</span>
              </div>
            ) : (
              <>
                <div className="dashboard__stat-card dashboard__stat-card--warning">
                  <span className="dashboard__stat-card-value">
                    {formatEur(stats.ventes_jour_en_attente_montant ?? 0)}
                  </span>
                  <span className="dashboard__stat-card-label">
                    CA en attente ({stats.ventes_jour_en_attente_count ?? 0})
                  </span>
                </div>
                <div className="dashboard__stat-card dashboard__stat-card--success">
                  <span className="dashboard__stat-card-value">
                    {formatEur(stats.ventes_jour_validees_montant ?? 0)}
                  </span>
                  <span className="dashboard__stat-card-label">
                    CA validé ({stats.ventes_jour_validees_count ?? 0})
                  </span>
                </div>
              </>
            )}
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
            ventesMoisEnAttenteCount={stats.ventes_mois_en_attente_count}
            ventesMoisEnAttenteMontant={stats.ventes_mois_en_attente_montant}
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
