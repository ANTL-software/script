import { useCampaign, useDialer } from '../../../hooks';
import { resolveRuntimeCampaignId } from '../../../utils/scripts/runtimeCampaign';
import './quiSommesNous.scss';
import { FaBuilding, FaUsers, FaHandshake, FaShieldAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaListOl } from 'react-icons/fa';

export default function QuiSommesNous() {
  const { currentCampaign } = useCampaign();
  const { currentCampagneId } = useDialer();

  const campagneId = resolveRuntimeCampaignId({
    currentCampaignId: currentCampaign?.id_campagne,
    currentDialerCampaignId: currentCampagneId,
    urlCampaignId: null,
  });

  const isMMA =
    currentCampaign?.type_campagne === 'lead_b2b' ||
    currentCampaign?.nom_campagne?.toLowerCase().includes('mma') ||
    campagneId === 10 ||
    campagneId === 8;

  if (isMMA) {
    return (
      <div className="qui-sommes-nous">
        <div className="qui-sommes-nous__header">
          <h2>Qui sommes-nous ?</h2>
          <p className="qui-sommes-nous__subtitle">Présentation de l'agence Planète Assurances MMA</p>
        </div>

        <div className="qui-sommes-nous__content">
          <section className="qui-sommes-nous__section">
            <div className="qui-sommes-nous__section-header">
              <FaBuilding className="qui-sommes-nous__icon" />
              <h3>Notre agence</h3>
            </div>
            <p>
              Planète Assurances MMA est une agence générale d'assurance présente depuis plus de 20 ans
              sur le territoire de la Charente-Maritime.
            </p>
            <p>
              L'Agence s'appuie sur une équipe de 4 agents généraux (<strong>Olivier QUENTIN, Myriam DUMAS-CARLETTI, Arnaud ASCHAUER et Emmanuel MOINARD</strong>)
              épaulés par 28 collaborateurs expérimentés, répartis sur 6 agences de proximité : 
              Rochefort, Royan, Saint-Pierre-d'Oléron, Tonnay-Charente, La Tremblade et Cozes.
            </p>
          </section>

          <section className="qui-sommes-nous__section">
            <div className="qui-sommes-nous__section-header">
              <FaHandshake className="qui-sommes-nous__icon" />
              <h3>Notre mission</h3>
            </div>
            <p>
              Accompagner nos clients dans la protection de leur activité et de leur avenir,
              en leur proposant des solutions d'assurance adaptées à chaque situation :
              responsabilité civile professionnelle, multirisque professionnelle, assurance des locaux commerciaux,
              flotte automobiles, assurances agricoles, BTP/construction.
            </p>
          </section>

          <section className="qui-sommes-nous__section">
            <div className="qui-sommes-nous__section-header">
              <FaListOl className="qui-sommes-nous__icon" />
              <h3>Nos 4 pôles de solutions assurantielles</h3>
            </div>
            <ul className="qui-sommes-nous__list">
              <li>
                <strong>1. PROTECTION DE L'OUTIL DE TRAVAIL</strong> : Assurance des bâtiments et marchandises ; Perte d'exploitation/Perte financière ; Bris de machine ; Flotte de véhicules/d'engins ; Marchandises transportées.
              </li>
              <li>
                <strong>2. PROTECTION DE SON ACTIVITÉ</strong> : Responsabilité civile professionnelle ; Responsabilité civile décennale (professionnels du bâtiment) ; Responsabilité civile des mandataires sociaux ; Assurances risques cyber ; Protection juridique.
              </li>
              <li>
                <strong>3. PROTECTION DU PATRIMOINE DE L'ENTREPRENEUR</strong> : Prévoyance et frais généraux ; garantie homme clé/Assurance emprunteur ; Santé ; Retraite complémentaire.
              </li>
              <li>
                <strong>4. PROTECTION DES SALARIÉS</strong> : Prévoyance et santé collective ; Retraite complémentaire ; indemnités de fin de carrière.
              </li>
            </ul>
          </section>

          <section className="qui-sommes-nous__section qui-sommes-nous__section--contact">
            <h3>Coordonnées de l'agence</h3>
            <div className="qui-sommes-nous__contact-grid">
              <div className="qui-sommes-nous__contact-item">
                <FaPhone className="qui-sommes-nous__contact-icon" />
                <div>
                  <strong>Téléphone</strong>
                  <span>05 46 99 00 28</span>
                </div>
              </div>
              <div className="qui-sommes-nous__contact-item">
                <FaEnvelope className="qui-sommes-nous__contact-icon" />
                <div>
                  <strong>Email</strong>
                  <a href="mailto:olivier.quentin@mma.fr" style={{ color: 'inherit', textDecoration: 'none' }}>
                    olivier.quentin@mma.fr
                  </a>
                </div>
              </div>
              <div className="qui-sommes-nous__contact-item">
                <FaMapMarkerAlt className="qui-sommes-nous__contact-icon" />
                <div>
                  <strong>Adresse</strong>
                  <span>2 rue du 14 Juillet, 17300 Rochefort</span>
                </div>
              </div>
            </div>
          </section>

          <section className="qui-sommes-nous__section qui-sommes-nous__section--legal">
            <p className="qui-sommes-nous__legal">
              Planète Assurances MMA - Agents Généraux d'Assurances - Intermédiaires inscrits à l'ORIAS (consulter le site www.orias.fr) - Siège social : Rochefort
            </p>
          </section>
        </div>
      </div>
    );
  }

  // Fallback par défaut (antl) - utilisé aussi pour les Cigales en attendant leur texte définitif
  return (
    <div className="qui-sommes-nous">
      <div className="qui-sommes-nous__header">
        <h2>Qui sommes-nous ?</h2>
        <p className="qui-sommes-nous__subtitle">Présentation de l'entreprise antl</p>
      </div>

      <div className="qui-sommes-nous__content">
        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaBuilding className="qui-sommes-nous__icon" />
            <h3>Notre entreprise</h3>
          </div>
          <p>
            antl est une entreprise spécialisée dans le conseil et la vente de solutions
            d'assurance adaptées aux besoins de chaque client. Depuis notre création, nous
            accompagnons les particuliers et les entreprises dans la protection de leurs biens
            et de leurs proches.
          </p>
          <p>
            Notre équipe de conseillers experts est à votre écoute pour vous proposer des
            solutions sur mesure, au meilleur rapport qualité-prix.
          </p>
        </section>

        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaUsers className="qui-sommes-nous__icon" />
            <h3>Nos valeurs</h3>
          </div>
          <ul className="qui-sommes-nous__list">
            <li>
              <strong>Proximité</strong> - Un conseiller dédié qui vous connaît et comprend vos besoins
            </li>
            <li>
              <strong>Transparence</strong> - Des offres claires, sans frais cachés
            </li>
            <li>
              <strong>Réactivité</strong> - Une réponse rapide à toutes vos demandes
            </li>
            <li>
              <strong>Expertise</strong> - Des conseillers formés et certifiés
            </li>
          </ul>
        </section>

        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaHandshake className="qui-sommes-nous__icon" />
            <h3>Nos engagements</h3>
          </div>
          <ul className="qui-sommes-nous__list">
            <li>Étude personnalisée et gratuite de votre situation</li>
            <li>Comparaison des meilleures offres du marché</li>
            <li>Accompagnement dans toutes vos démarches</li>
            <li>Suivi régulier de votre dossier</li>
            <li>Service client disponible du lundi au vendredi</li>
          </ul>
        </section>

        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaShieldAlt className="qui-sommes-nous__icon" />
            <h3>Nos garanties</h3>
          </div>
          <div className="qui-sommes-nous__guarantees">
            <div className="qui-sommes-nous__guarantee">
              <span className="qui-sommes-nous__guarantee-number">100%</span>
              <span className="qui-sommes-nous__guarantee-text">Satisfaction client</span>
            </div>
            <div className="qui-sommes-nous__guarantee">
              <span className="qui-sommes-nous__guarantee-number">48h</span>
              <span className="qui-sommes-nous__guarantee-text">Délai de réponse</span>
            </div>
            <div className="qui-sommes-nous__guarantee">
              <span className="qui-sommes-nous__guarantee-number">0</span>
              <span className="qui-sommes-nous__guarantee-text">Frais de dossier</span>
            </div>
          </div>
        </section>

        <section className="qui-sommes-nous__section qui-sommes-nous__section--contact">
          <h3>Nous contacter</h3>
          <div className="qui-sommes-nous__contact-grid">
            <div className="qui-sommes-nous__contact-item">
              <FaPhone className="qui-sommes-nous__contact-icon" />
              <div>
                <strong>Téléphone</strong>
                <span>01 23 45 67 89</span>
              </div>
            </div>
            <div className="qui-sommes-nous__contact-item">
              <FaEnvelope className="qui-sommes-nous__contact-icon" />
              <div>
                <strong>Email</strong>
                <span>contact@antl.fr</span>
              </div>
            </div>
            <div className="qui-sommes-nous__contact-item">
              <FaMapMarkerAlt className="qui-sommes-nous__contact-icon" />
              <div>
                <strong>Adresse</strong>
                <span>123 Avenue des Champs-Élysées, 75008 Paris</span>
              </div>
            </div>
          </div>
        </section>

        <section className="qui-sommes-nous__section qui-sommes-nous__section--legal">
          <p className="qui-sommes-nous__legal">
            antl - SARL au capital de 50 000 euros - RCS Paris 123 456 789 -
            ORIAS n° 12 345 678 - Courtier en assurances
          </p>
        </section>
      </div>
    </div>
  );
}
