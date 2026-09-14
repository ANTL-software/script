import './dashboardPage.scss';
import { useDashboardPage } from '../../../hooks/index.ts';
import { CalendarModal, PrimeGauge } from '../../components/index.ts';

import { formatCurrency, formatEur } from '../../../utils/scripts/index.ts';

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
    pendingVenteItems,
    pendingVentesLoading,
    pendingVentesError,
    isSalesCampaign,
    handleSearch,
    isCalendarModalOpen,
    openCalendar,
    closeCalendar,
    openRendezVous,
    openPendingVente,
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
            inputMode="tel"
            placeholder="Numéro de téléphone, ex. +377 93 10 52 52"
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

      <div className={`dashboard__grid ${isSalesCampaign ? '' : 'dashboard__grid--single'}`}>
        <section className="dashboard__card dashboard__rdv">
          <div className="dashboard__card-header">
            <h2 className="dashboard__section-title">
              Mes rappels du jour
              {rendezVousItems.length > 0 && <span className="dashboard__badge">{rendezVousItems.length}</span>}
            </h2>
            <button
              className="dashboard__calendar-btn"
              onClick={openCalendar}
            >
              Afficher le calendrier
            </button>
          </div>

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

        {isSalesCampaign && (
          <section className="dashboard__card dashboard__pending-sales">
            <h2 className="dashboard__section-title">
              Mes commandes en attentes
              {pendingVenteItems.length > 0 && (
                <span className="dashboard__badge dashboard__badge--warning">
                  {pendingVenteItems.length}
                </span>
              )}
            </h2>

            {pendingVentesLoading ? (
              <p className="dashboard__loading">Chargement...</p>
            ) : pendingVentesError ? (
              <div className="dashboard__empty-state">
                <p>{pendingVentesError}</p>
              </div>
            ) : pendingVenteItems.length === 0 ? (
              <div className="dashboard__empty-state">
                <p>Aucune commande en attente.</p>
              </div>
            ) : (
              <ul className="dashboard__pending-sales-list">
                {pendingVenteItems.map((item) => (
                  <li key={item.vente.id_vente}>
                    <button
                      type="button"
                      className="dashboard__pending-sale-item"
                      onClick={() => openPendingVente(item.url)}
                      aria-label={`Ouvrir la fiche de ${item.prospectLabel}`}
                    >
                      <span className="dashboard__pending-sale-info">
                        <span className="dashboard__pending-sale-prospect">{item.prospectLabel}</span>
                        <span className="dashboard__pending-sale-reference">{item.referenceLabel}</span>
                      </span>
                      <span className="dashboard__pending-sale-meta">
                        <span>{item.dateLabel}</span>
                        <strong>{formatCurrency(item.vente.montant_total)}</strong>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {isSalesCampaign && (
        <section className="dashboard__monthly-orders" aria-label="Commandes du mois en cours">
          <span className="dashboard__monthly-orders-title">Commandes du mois</span>
          <div className="dashboard__monthly-order-indicators">
            <div className="dashboard__monthly-order-indicator dashboard__monthly-order-indicator--success">
              <strong>{statsLoading ? '—' : (stats?.ventes_mois_count ?? 0)}</strong>
              <span>Validées</span>
            </div>
            <div className="dashboard__monthly-order-indicator dashboard__monthly-order-indicator--warning">
              <strong>{statsLoading ? '—' : (stats?.ventes_mois_en_attente_count ?? 0)}</strong>
              <span>En attente</span>
            </div>
            <div className="dashboard__monthly-order-indicator dashboard__monthly-order-indicator--danger">
              <strong>{statsLoading ? '—' : (stats?.ventes_mois_annulees_count ?? 0)}</strong>
              <span>Annulées</span>
            </div>
          </div>
        </section>
      )}

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
          <PrimeGauge
            ventesMoisCount={stats.ventes_mois_count ?? 0}
            ventesMoisEnAttenteCount={stats.ventes_mois_en_attente_count}
            ventesMoisEnAttenteMontant={stats.ventes_mois_en_attente_montant}
            prime={stats.prime}
          />
        ) : (
          <div className="dashboard__empty-state">
            <p>Aucun palier de prime assigné à votre profil.</p>
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
