import './dashboardPage.scss';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useDialer } from '../../../hooks';
import { formatEur, formatHeure, formatProspectName } from '../../../utils/scripts/formatters';
import type { RendezVous } from '../../../utils/types';
import SalesGauge from '../../components/salesGauge/SalesGauge';

function prospectLabel(rdv: RendezVous): string {
  const p = rdv.prospect;
  if (!p) return 'Prospect inconnu';
  return formatProspectName({ nom: p.nom, prenom: p.prenom });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { prochainProspect, clearProchainProspect, call } = useDialer();

  // Quand le contexte dialer reçoit un prospect assigné, on ouvre sa fiche et on lance l'appel
  useEffect(() => {
    if (!prochainProspect) return;
    const { id_prospect, telephone, id_campagne_assignee } = prochainProspect;
    clearProchainProspect();
    navigate(`/prospect/${id_prospect}`);
    call(telephone, id_campagne_assignee ?? undefined, id_prospect);
  }, [prochainProspect, clearProchainProspect, navigate, call]);

  const {
    searchQuery, setSearchQuery, isSearching, searchError,
    rdvDuJour, rdvLoading,
    stats, statsLoading,
    notifications, nonLues, notifsLoading,
    handleSearch, handleMarquerLue, handleMarquerToutLu,
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
                  <button
                    className="dashboard__rdv-btn"
                    onClick={() => rdv.prospect && navigate(`/prospect/${rdv.prospect.id_prospect}`)}
                    disabled={!rdv.prospect}
                  >
                    Ouvrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard__card dashboard__notifications">
          <div className="dashboard__notifications-header">
            <h2 className="dashboard__section-title">
              Notifications
              {nonLues > 0 && <span className="dashboard__badge dashboard__badge--alert">{nonLues}</span>}
            </h2>
            {notifications.length > 0 && (
              <button className="dashboard__link-btn" onClick={handleMarquerToutLu}>
                Tout marquer lu
              </button>
            )}
          </div>

          {notifsLoading ? (
            <p className="dashboard__loading">Chargement...</p>
          ) : notifications.length === 0 ? (
            <div className="dashboard__empty-state">
              <p>Aucune notification.</p>
            </div>
          ) : (
            <ul className="dashboard__notif-list">
              {notifications.map(notif => (
                <li key={notif.id_notification} className="dashboard__notif-item">
                  <div className="dashboard__notif-content">
                    <span className={`dashboard__notif-dot dashboard__notif-dot--${notif.type ?? 'info'}`} />
                    <p className="dashboard__notif-message">{notif.message}</p>
                  </div>
                  <button
                    className="dashboard__link-btn"
                    onClick={() => handleMarquerLue(notif.id_notification)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
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
    </main>
  );
}
