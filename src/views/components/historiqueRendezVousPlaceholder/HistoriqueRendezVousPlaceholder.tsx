import './historiqueRendezVousPlaceholder.scss';
import RendezVousCard, { type RendezVousClient } from './RendezVousCard';

const MOCK_RENDEZ_VOUS: RendezVousClient[] = [
  {
    id: 1,
    date: '2026-07-15',
    heure: '14:30',
    statut: 'confirme',
    interlocuteur: {
      nom: 'M. Jean Dupont',
      role: 'Directeur Général',
    },
    coordonnees: {
      telephone: '06 12 34 56 78',
      email: 'j.dupont@entreprise.fr',
    },
    agent: 'Sophie Martin',
    notes: "Intérêt très fort pour une étude comparative sur la multirisque professionnelle. Contrat actuel se termine en fin d'année chez AXA. Souhaite des garanties solides sur le matériel informatique.",
    clientFinal: 'MMA Agence Bordeaux Centre',
  },
  {
    id: 2,
    date: '2026-06-10',
    heure: '10:00',
    statut: 'effectue',
    interlocuteur: {
      nom: 'Mme. Valérie Lemoine',
      role: 'Responsable RH',
    },
    coordonnees: {
      telephone: '07 98 76 54 32',
      email: 'v.lemoine@solutions.com',
    },
    agent: 'Sophie Martin',
    notes: 'Rendez-vous de bilan effectué en présentiel. Le prospect a fourni ses conditions générales actuelles. L\'agent MMA est en train d\'établir la contre-proposition commerciale.',
    clientFinal: 'MMA Agence Paris Suffren',
  },
  {
    id: 3,
    date: '2026-05-22',
    heure: '11:15',
    statut: 'annule',
    interlocuteur: {
      nom: 'M. Charles Bertrand',
      role: 'Gérant',
    },
    coordonnees: {
      telephone: '05 55 44 33 22',
      email: 'c.bertrand@garage-nord.fr',
    },
    agent: 'Jean-Marc Bernard',
    notes: "Le prospect a annulé le rendez-vous car son associé a déjà renouvelé leur contrat d'assurance multirisque auprès d'un courtier local la semaine dernière. Dossier à classer.",
    clientFinal: 'MMA Agence Lille Flandres',
  }
];

export default function HistoriqueRendezVousPlaceholder() {
  if (MOCK_RENDEZ_VOUS.length === 0) {
    return (
      <div className="historique-rendez-vous">
        <div className="historique-rendez-vous__empty">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>Aucun rendez-vous client enregistré</h3>
          <p>Ce prospect n'a pas encore de rendez-vous qualifié planifié ou effectué avec nos partenaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historique-rendez-vous">
      <div className="historique-rendez-vous__header">
        <h2>Historique des rendez-vous client</h2>
        <span className="historique-rendez-vous__count">
          {MOCK_RENDEZ_VOUS.length} rendez-vous
        </span>
      </div>

      <div className="historique-rendez-vous__list">
        {MOCK_RENDEZ_VOUS.map((rdv) => (
          <RendezVousCard key={rdv.id} rdv={rdv} />
        ))}
      </div>
    </div>
  );
}
