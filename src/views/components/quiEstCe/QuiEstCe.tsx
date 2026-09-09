import './quiEstCe.scss';
import { useQuiEstCe } from '../../../hooks/index.ts';
import { Button } from '../button/index.ts';
import { Input } from '../input/index.ts';
import { AddressAutocomplete } from '../addressAutocomplete/index.ts';
import { ProgPAReadonly } from '../progPA/index.ts';
import { FaSave, FaEdit, FaLinkedinIn, FaTimes } from 'react-icons/fa';
import {
  formatDateLong,
  getCampaignVariant,
  getStatutProspectLabel,
} from '../../../utils/scripts/index.ts';

export default function QuiEstCe() {
  const { currentProspect, currentCampaign, isLoading, isEditing, isSaving, editedFields, errors, maturityBadge, posteOuvert, accroche, linkedin, urlOffreEmploi, angleApproche, isFgaCampaign, recruitmentElementCount, linkedinHref, jobOfferHref, handleFieldChange, handleSelectAdresseFacturation, handleSelectAdresseLivraison, handleEdit, handleCancel, handleSave } = useQuiEstCe();

  if (!currentProspect) {
    return (
      <div className="qui-est-ce">
        <div className="qui-est-ce__empty">
          <p>Aucun prospect selectionne</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qui-est-ce">
      <div className="qui-est-ce__header">
        <div className="qui-est-ce__heading">
          <h2>Qui est-ce ?</h2>
          <span
            className="qui-est-ce__maturity-badge"
            data-relation={maturityBadge.variant}
          >
            {maturityBadge.label}
          </span>
        </div>
        <ProgPAReadonly
          value={currentProspect.max_progpa_campagne}
          campaignVariant={getCampaignVariant(currentCampaign)}
          commercialFollowup={currentProspect.suivi_commercial_en_cours}
        />
        <div className="qui-est-ce__actions">
          {!isEditing ? (
            <Button variant="primary" size="small" onClick={handleEdit}>
              <FaEdit /> Modifier
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="small" onClick={handleCancel} disabled={isSaving}>
                <FaTimes /> Annuler
              </Button>
              <Button variant="primary" size="small" onClick={handleSave} isLoading={isSaving}>
                <FaSave /> Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="qui-est-ce__content">
        {isFgaCampaign && recruitmentElementCount > 0 && (
          <div className="qui-est-ce__section qui-est-ce__section--fga">
            <h3>Éléments de recrutement</h3>
            <div className={`qui-est-ce__fga-row${recruitmentElementCount === 3 ? ' qui-est-ce__fga-row--three-items' : ''}`}>
              {posteOuvert && (
                <div className="qui-est-ce__fga-block qui-est-ce__fga-block--poste">
                  <span className="qui-est-ce__fga-label">Poste ouvert</span>
                  <p className="qui-est-ce__fga-value">{posteOuvert}</p>
                </div>
              )}
              {accroche && (
                <div className="qui-est-ce__fga-block qui-est-ce__fga-block--accroche">
                  <span className="qui-est-ce__fga-label">Accroche d'appel</span>
                  <p className="qui-est-ce__fga-value">{accroche}</p>
                </div>
              )}
              {linkedin && (
                <div className="qui-est-ce__fga-block qui-est-ce__fga-block--linkedin">
                  <span className="qui-est-ce__fga-label">LinkedIn</span>
                  {linkedinHref ? (
                    <a
                      className="qui-est-ce__fga-linkedin-link"
                      href={linkedinHref}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <FaLinkedinIn aria-hidden="true" />
                      Ouvrir le profil LinkedIn
                    </a>
                  ) : (
                    <p className="qui-est-ce__fga-value">{linkedin}</p>
                  )}
                </div>
              )}
              {urlOffreEmploi && (
                <div className="qui-est-ce__fga-block qui-est-ce__fga-block--job-offer">
                  <span className="qui-est-ce__fga-label">Offre d'emploi</span>
                  {jobOfferHref ? (
                    <a
                      className="qui-est-ce__fga-linkedin-link"
                      href={jobOfferHref}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Ouvrir l'offre d'emploi
                    </a>
                  ) : (
                    <p className="qui-est-ce__fga-value">{urlOffreEmploi}</p>
                  )}
                </div>
              )}
              {angleApproche && (
                <div className="qui-est-ce__fga-block qui-est-ce__fga-block--angle">
                  <span className="qui-est-ce__fga-label">Angle d'approche</span>
                  <p className="qui-est-ce__fga-value">{angleApproche}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="qui-est-ce__section">
          <h3>Informations generales</h3>
          <div className="qui-est-ce__grid">
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Type</span>
              <span className="qui-est-ce__value">{currentProspect.type_prospect}</span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Statut</span>
              <span
                className="qui-est-ce__value qui-est-ce__value--statut"
                data-statut={currentProspect.statut_campagne ?? currentProspect.statut}
              >
                {getStatutProspectLabel(currentProspect.statut_campagne ?? currentProspect.statut)}
              </span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Nom</span>
              {isEditing ? (
                <Input
                  value={editedFields.nom}
                  onChange={(e) => handleFieldChange('nom', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.nom}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Prenom</span>
              {isEditing ? (
                <Input
                  value={editedFields.prenom}
                  onChange={(e) => handleFieldChange('prenom', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.prenom || '-'}</span>
              )}
            </div>
            {currentProspect.type_prospect === 'Entreprise' && (
              <div className="qui-est-ce__field qui-est-ce__field--full">
                <span className="qui-est-ce__label">Raison sociale</span>
                {isEditing ? (
                  <Input
                    value={editedFields.raison_sociale}
                    onChange={(e) => handleFieldChange('raison_sociale', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.raison_sociale || '-'}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {currentProspect.type_prospect === 'Entreprise' && (
          <div className="qui-est-ce__section">
            <h3>Informations entreprise</h3>
            <div className="qui-est-ce__grid">
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">SIRET</span>
                {isEditing ? (
                  <Input
                    value={editedFields.siret}
                    onChange={(e) => handleFieldChange('siret', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.siret || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Code NAF</span>
                {isEditing ? (
                  <Input
                    value={editedFields.code_naf}
                    onChange={(e) => handleFieldChange('code_naf', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.code_naf || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field qui-est-ce__field--full">
                <span className="qui-est-ce__label">Activite</span>
                {isEditing ? (
                  <Input
                    value={editedFields.activite}
                    onChange={(e) => handleFieldChange('activite', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.activite || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Secteur</span>
                {isEditing ? (
                  <Input
                    value={editedFields.secteur}
                    onChange={(e) => handleFieldChange('secteur', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.secteur || '-'}</span>
                )}
              </div>
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Region</span>
                {isEditing ? (
                  <Input
                    value={editedFields.region}
                    onChange={(e) => handleFieldChange('region', e.target.value)}
                    disabled={isLoading || isSaving}
                  />
                ) : (
                  <span className="qui-est-ce__value">{currentProspect.region || '-'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="qui-est-ce__section">
          <h3>Contact</h3>
          <div className="qui-est-ce__grid">
            {isEditing ? (
              <div className="qui-est-ce__field">
                <span className="qui-est-ce__label">Civilite</span>
                <Input
                  value={editedFields.civilite}
                  onChange={(e) => handleFieldChange('civilite', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              </div>
            ) : (
              currentProspect.civilite && (
                <div className="qui-est-ce__field">
                  <span className="qui-est-ce__label">Civilite</span>
                  <span className="qui-est-ce__value">{currentProspect.civilite}</span>
                </div>
              )
            )}
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Telephone</span>
              <span className="qui-est-ce__value">{currentProspect.telephone}</span>
              <span className="qui-est-ce__hint">(Non modifiable - ID fiche)</span>
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Tel. contact</span>
              {isEditing ? (
                <Input
                  value={editedFields.telephone_contact}
                  onChange={(e) => handleFieldChange('telephone_contact', e.target.value)}
                  disabled={isLoading || isSaving}
                  placeholder="Ligne directe / portable"
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.telephone_contact || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedFields.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  error={errors.email}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.email || '-'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="qui-est-ce__section">
          <h3>Adresse</h3>
          <div className="qui-est-ce__grid">
            <div className="qui-est-ce__field qui-est-ce__field--full">
              <label className="qui-est-ce__label" htmlFor="qui-address-billing">Adresse facturation</label>
              {isEditing ? (
                <AddressAutocomplete
                  id="qui-address-billing"
                  value={editedFields.adresse_facturation}
                  onChange={(val) => handleFieldChange('adresse_facturation', val)}
                  onSelectAddress={handleSelectAdresseFacturation}
                  disabled={isLoading || isSaving}
                  placeholder="Rechercher une adresse de facturation (ex: 10 rue de la paix)..."
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.adresse_facturation || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field qui-est-ce__field--full">
              <label className="qui-est-ce__label" htmlFor="qui-address-delivery">Adresse livraison complète</label>
              {isEditing ? (
                <AddressAutocomplete
                  id="qui-address-delivery"
                  value={editedFields.adresse_livraison}
                  onChange={(val) => handleFieldChange('adresse_livraison', val)}
                  onSelectAddress={handleSelectAdresseLivraison}
                  disabled={isLoading || isSaving}
                  placeholder="Rechercher une adresse de livraison..."
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.adresse_livraison || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Code postal</span>
              {isEditing ? (
                <Input
                  value={editedFields.code_postal}
                  onChange={(e) => handleFieldChange('code_postal', e.target.value)}
                  error={errors.code_postal}
                  disabled={isLoading || isSaving}
                  maxLength={5}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.code_postal || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Ville</span>
              {isEditing ? (
                <Input
                  value={editedFields.ville}
                  onChange={(e) => handleFieldChange('ville', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.ville || '-'}</span>
              )}
            </div>
            <div className="qui-est-ce__field">
              <span className="qui-est-ce__label">Pays</span>
              {isEditing ? (
                <Input
                  value={editedFields.pays}
                  onChange={(e) => handleFieldChange('pays', e.target.value)}
                  disabled={isLoading || isSaving}
                />
              ) : (
                <span className="qui-est-ce__value">{currentProspect.pays || 'France'}</span>
              )}
            </div>
          </div>
        </div>

        {currentProspect.notes && (
          <div className="qui-est-ce__section">
            <h3>Notes</h3>
            <div className="qui-est-ce__notes">
              <p>{currentProspect.notes}</p>
            </div>
          </div>
        )}

        <div className="qui-est-ce__section qui-est-ce__section--meta">
          <div className="qui-est-ce__meta">
            <span>Cree le {formatDateLong(currentProspect.created_at)}</span>
            <span>Modifie le {formatDateLong(currentProspect.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
