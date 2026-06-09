import './planAppelPage.scss';
import { usePlanAppel } from '../../../hooks/usePlanAppel';
import Button from '../../components/button/Button';
import Loader from '../../components/loader/Loader';
import { FaChevronLeft, FaChevronRight, FaListOl } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import type { PlanAppelEtape } from '../../../utils/types';

const CIGALES_PLAN_APPEL: PlanAppelEtape[] = [
  {
    id_plan: 1,
    id_campagne: 7,
    etape: 1,
    titre: 'IDENTIFICATION - Obtenir le nom du décisionnaire',
    contenu: `Bonjour, vous allez sûrement pouvoir m’orienter. Je suis Sophie LAGAGNE des Cigales, j’aimerais parler au responsable de l’établissement mais je n’ai pas son nom, c’est Madame… Monsieur… ? Vous pouvez me le/la passer s’il vous plaît ?

« C’est pourquoi ? » : C’est l’ESAT Les Cigales, le centre médico-social de l’AGAPEI 13.

(Si elle insiste :)

« Oui mais c’est à quel sujet ? » : C’est pour le programme d’accompagnement professionnel des travailleurs en situation de handicap. Vous pouvez me la/le passer, s’il vous plaît ?`,
    ordre_affichage: 10,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 2,
    id_campagne: 7,
    etape: 2,
    titre: 'PRESENTATION - Se faire accepter par le décisionnaire',
    contenu: `Bonjour Mme/M. ... Je suis Sophie LAGAGNE, déléguée de l’ESAT Les Cigales, le centre pour les travailleurs en situation de handicap. Comment allez-vous ?

L’ESAT Les Cigales à Salon-de-Provence, ça vous dit quelque chose ?

En quelques mots, nous sommes une structure médico-sociale qui accueille plus de 120 usagers ; un public qui se heurte à une difficulté d’embauche de la part des entreprises. Il faut dire que toutes les entreprises ne sont pas organisées pour mettre en place un accompagnement comme nous le faisons.

Concrètement, la préparation de commandes pour des clients tels que vous permet de favoriser l’apprentissage d’un métier, de valoriser les personnes et de garantir une inclusion sociale et économique.`,
    ordre_affichage: 20,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 3,
    id_campagne: 7,
    etape: 3,
    titre: 'DECOUVERTE - Comprendre l’environnement du client pour créer un lien',
    contenu: `Vous le savez peut-être, mais depuis 2005, le Gouvernement a renforcé le mécanisme d’incitation à l’embauche des personnes en situation de handicap. D’ailleurs, vous-même, avez-vous du personnel en situation de handicap dans votre entreprise, Mme/M. Untel ?

Si oui… : Eh bien bravo ! Cela montre que vous êtes sensible à cette cause et c’est très motivant pour nous. Avez-vous dû adapter leurs postes ? (Si oui, comment ?) Il faut tout de même reconnaître que depuis 20 ans, l’effort des entreprises a été très encourageant pour aménager des postes adaptés mais c’est encore insuffisant.

Si non : C’est que vous êtes une petite structure, c’est cela ? D’ailleurs, vous êtes combien chez vous ? Je comprends tout à fait qu’on ne puisse pas toujours accompagner le personnel en situation de handicap…

Et c’est là que nous intervenons : les achats que vous effectuez auprès de notre établissement vous permettent de participer à cet effort, voire même de bénéficier d’une réduction de la taxe AGEFIPH si vous y êtes assujetti. J’imagine que vous comprenez le sens de ma mission, Mme/M. Untel ; qu’en pensez-vous ?`,
    ordre_affichage: 30,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 4,
    id_campagne: 7,
    etape: 4,
    titre: 'PROPOSITION - Obtenir un accord de principe',
    contenu: `Sachez que depuis plus de 40 ans, nous développons notre distribution de fournitures de bureau sur l’ensemble du territoire, et avec notre gamme développement durable et locale, nous mettons en avant notre ambition environnementale pour faire émerger des solutions écoresponsables.

Je viens vers vous aujourd’hui pour vous offrir l’opportunité de vous compter parmi nos partenaires privilégiés et de contribuer à notre cause par le biais d’une commande de fournitures de bureau. Qu’est-ce qui vous est le plus utile, plutôt de la papeterie ou des produits d’hygiène ?`,
    ordre_affichage: 40,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 5,
    id_campagne: 7,
    etape: 5,
    titre: 'COMMANDE – Transformer l’accord de principe en commande ferme',
    contenu: `Merci pour l’intérêt que vous nous portez. Je peux vous proposer les packs découverte que nous avons l’habitude de vendre à nos nouveaux partenaires, à moins que vous préfériez un colis plus personnalisé ? Nous disposons d’une gamme de produits élargie qui permet de nous adapter à vos besoins avec précision.

Détection produit :

- On propose un ou plusieurs kits en fonction du budget du client.
- On récapitule la commande et on annonce le tarif HT, frais de port inclus.
- Validation des coordonnées du client.
- Délai de livraison.
- Délai de règlement.`,
    ordre_affichage: 50,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 6,
    id_campagne: 7,
    etape: 6,
    titre: 'RETOUR DE COMMANDE - Faire revenir la commande « acceptée »',
    contenu: `Pour valider votre participation, j’ai besoin que vous me retourniez le bon de commande signé, avec votre bon pour accord. Je peux compter sur vous pour un retour dans la foulée ?

Sans nouvelles de votre part dans les 10 minutes, je me permettrai un rappel pour m’assurer de la bonne réception du bon de commande, c’est ok pour vous ?`,
    ordre_affichage: 60,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 7,
    id_campagne: 7,
    etape: 7,
    titre: 'PRISE DE CONGÉ - Préparer le prochain appel et laisser une bonne image',
    contenu: `De la part de tous les travailleurs de l’ESAT Les Cigales, encore mille mercis pour votre soutien !

Je me permettrai de vous rappeler à réception de la commande pour m’assurer que tout se sera bien passé. Entre-temps, si vous avez des questions, n’hésitez pas à me contacter par e-mail ou par téléphone, vous trouverez toutes nos coordonnées sur le bon de commande.`,
    ordre_affichage: 70,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 8,
    id_campagne: 7,
    etape: 8,
    titre: 'CONTRÔLE SATISFACTION - Valider la satisfaction client après livraison',
    contenu: `Bonjour, c’est Sophie Lagagne de l’ESAT Les Cigales, j’aimerais parler à Mme/M. Untel.

Bonjour Mme/M. Untel, c’est Sophie pour l’ESAT Les Cigales, vous vous souvenez de moi ? Comment allez-vous ? Vous avez dû recevoir votre commande ? Je viens m’assurer que la livraison s’est bien passée ?

Si non : J’en suis désolée, je vais reporter ces désagréments à l’atelier qui ne manquera pas de revenir vers vous pour trouver une solution, et je me permettrai un rappel pour m’assurer que le problème a été réglé.
(On arrête l’appel et on en reprogramme un autre pour suivre le litige)

Si oui… : J’en suis ravie ! Pensez à faire savoir à vos collaborateurs que les produits qu’ils vont utiliser ont été conditionnés par des travailleurs en situation de handicap. Je sais que les gens ont souvent à cœur de participer à la cause, et ça donnera une image très positive de votre entreprise.

Avant de vous laisser, j’ai 2 faveurs à vous demander : 1- Auriez-vous la gentillesse de mettre un avis positif sur le site internet de l’ESAT ? et 2- Dans combien de temps pensez-vous avoir consommé les articles, afin que je ne revienne pas vers vous trop tôt pour une future commande ?`,
    ordre_affichage: 80,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  }
];

export default function PlanAppelPage() {
  const [searchParams] = useSearchParams();
  const campagneId = searchParams.get('campagne');

  const {
    etapes: apiEtapes,
    currentEtapeIndex,
    setCurrentEtapeIndex,
    campagneName: apiCampagneName,
    isLoading: apiIsLoading,
    error: apiError,
  } = usePlanAppel();

  const isCigales = campagneId === '7';
  const etapes = isCigales ? CIGALES_PLAN_APPEL : apiEtapes;
  const campagneName = isCigales ? 'Les cigales' : apiCampagneName;
  const isLoading = isCigales ? false : apiIsLoading;
  const error = isCigales ? null : apiError;

  const handlePrevious = () => {
    if (currentEtapeIndex > 0) {
      setCurrentEtapeIndex(currentEtapeIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentEtapeIndex < etapes.length - 1) {
      setCurrentEtapeIndex(currentEtapeIndex + 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentEtapeIndex(index);
  };

  if (isLoading) {
    return (
      <div className="plan-appel-page">
        <div className="plan-appel-page__loader">
          <Loader size="large" />
          <p>Chargement du plan d'appel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plan-appel-page">
        <div className="plan-appel-page__error">
          <FaListOl className="plan-appel-page__error-icon" />
          <h2>Plan d'appel</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const currentEtape = etapes[currentEtapeIndex];

  return (
    <div className="plan-appel-page">
      <header className="plan-appel-page__header">
        <div className="plan-appel-page__title">
          <FaListOl className="plan-appel-page__icon" />
          <div>
            <h1>Plan d'appel</h1>
            <span className="plan-appel-page__campaign-name">{campagneName}</span>
          </div>
        </div>
      </header>

      <div className="plan-appel-page__stepper">
        {etapes.map((etape, index) => (
          <button
            key={etape.id_plan}
            className={`plan-appel-page__step ${index === currentEtapeIndex ? 'plan-appel-page__step--active' : ''} ${index < currentEtapeIndex ? 'plan-appel-page__step--completed' : ''}`}
            onClick={() => handleStepClick(index)}
          >
            <span className="plan-appel-page__step-number">{index + 1}</span>
            <span className="plan-appel-page__step-title">{etape.titre}</span>
          </button>
        ))}
      </div>

      <main className="plan-appel-page__content">
        <div className="plan-appel-page__etape">
          <div className="plan-appel-page__etape-header">
            <span className="plan-appel-page__etape-number">Etape {currentEtapeIndex + 1} / {etapes.length}</span>
            <h2 className="plan-appel-page__etape-title">{currentEtape.titre}</h2>
          </div>
          <div className="plan-appel-page__etape-content">
            {currentEtape.contenu.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>

      <footer className="plan-appel-page__footer">
        <Button
          variant="secondary"
          size="medium"
          onClick={handlePrevious}
          disabled={currentEtapeIndex === 0}
        >
          <FaChevronLeft /> Precedent
        </Button>
        <span className="plan-appel-page__progress">
          {currentEtapeIndex + 1} / {etapes.length}
        </span>
        <Button
          variant="primary"
          size="medium"
          onClick={handleNext}
          disabled={currentEtapeIndex === etapes.length - 1}
        >
          Suivant <FaChevronRight />
        </Button>
      </footer>
    </div>
  );
}

