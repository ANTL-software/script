import './quiSommesNous.scss';
import { FaBuilding, FaUsers, FaHandshake, FaShieldAlt, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

export default function QuiSommesNous() {
  return (
    <div className="qui-sommes-nous">
      <div className="qui-sommes-nous__header">
        <h2>Qui sommes-nous ?</h2>
        <p className="qui-sommes-nous__subtitle">Presentation de l'entreprise ANTL</p>
      </div>

      <div className="qui-sommes-nous__content">
        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaBuilding className="qui-sommes-nous__icon" />
            <h3>Notre entreprise</h3>
          </div>
          <p>
            ANTL est une entreprise specialisee dans le conseil et la vente de solutions
            d'assurance adaptees aux besoins de chaque client. Depuis notre creation, nous
            accompagnons les particuliers et les entreprises dans la protection de leurs biens
            et de leurs proches.
          </p>
          <p>
            Notre equipe de conseillers experts est a votre ecoute pour vous proposer des
            solutions sur mesure, au meilleur rapport qualite-prix.
          </p>
        </section>

        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaUsers className="qui-sommes-nous__icon" />
            <h3>Nos valeurs</h3>
          </div>
          <ul className="qui-sommes-nous__list">
            <li>
              <strong>Proximite</strong> - Un conseiller dedie qui vous connait et comprend vos besoins
            </li>
            <li>
              <strong>Transparence</strong> - Des offres claires, sans frais caches
            </li>
            <li>
              <strong>Reactivite</strong> - Une reponse rapide a toutes vos demandes
            </li>
            <li>
              <strong>Expertise</strong> - Des conseillers formes et certifies
            </li>
          </ul>
        </section>

        <section className="qui-sommes-nous__section">
          <div className="qui-sommes-nous__section-header">
            <FaHandshake className="qui-sommes-nous__icon" />
            <h3>Nos engagements</h3>
          </div>
          <ul className="qui-sommes-nous__list">
            <li>Etude personnalisee et gratuite de votre situation</li>
            <li>Comparaison des meilleures offres du marche</li>
            <li>Accompagnement dans toutes vos demarches</li>
            <li>Suivi regulier de votre dossier</li>
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
              <span className="qui-sommes-nous__guarantee-text">Delai de reponse</span>
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
                <strong>Telephone</strong>
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
                <span>123 Avenue des Champs-Elysees, 75008 Paris</span>
              </div>
            </div>
          </div>
        </section>

        <section className="qui-sommes-nous__section qui-sommes-nous__section--legal">
          <p className="qui-sommes-nous__legal">
            ANTL - SARL au capital de 50 000 euros - RCS Paris 123 456 789 -
            ORIAS n° 12 345 678 - Courtier en assurances
          </p>
        </section>
      </div>
    </div>
  );
}
