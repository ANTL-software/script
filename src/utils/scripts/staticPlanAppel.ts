import type { PlanAppelEtape } from '../types';

export const CIGALES_PLAN_APPEL: PlanAppelEtape[] = [
  {
    id_plan: 1,
    id_campagne: 7,
    etape: 1,
    titre: 'IDENTIFICATION - Obtenir le nom du décisionnaire',
    contenu: `Bonjour, vous allez sûrement pouvoir m’orienter, je suis Sophie LAGAGNE des Cigales, j’aimerais parler au responsable de l’établissement mais je n’ai pas son nom, c’est Madame… Monsieur… ? Vous pouvez me le/la passer, s’il vous plaît ?

« C’est pourquoi ? » : C’est l’ESAT Les Cigales, le centre de médico-social de l’AGAPEI 13.

Si elle insiste :

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
    contenu: `Bonjour M./Mme… Je suis Sophie LAGAGNE, déléguée de l’ESAT Les Cigales, le centre pour les travailleurs en situation de handicap. Comment allez-vous ?

L’ESAT Les Cigales à Salon-de-Provence, ça vous dit quelque chose ?`,
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
    contenu: `En quelques mots, nous sommes une structure médico-social qui accueille plus de 120 usagers ; un public qui se heurte à une difficulté d’embauche de la part des entreprises. Il faut dire que toutes les entreprises ne sont pas organisées pour mettre en place un accompagnement comme nous le faisons.

D’ailleurs, vous Mr UNTEL, vous avez des travailleurs en situation de handicap ?

Si oui… : Eh bien bravo ! Cela montre que vous êtes sensible à cette cause et c’est très motivant pour nous. Avez-vous dû adapter leurs postes ? (si oui, comment ?) Il faut tout de même reconnaître que l’effort des entreprises est encourageant pour aménager des postes adaptés mais c’est encore insuffisant.

Si non : C’est que vous êtes une petite structure, c’est cela ? D’ailleurs vous êtes combien chez vous ? Je comprends tout à fait qu’on ne puisse pas toujours accompagner le personnel en situation de handicap…

C’est là que nous intervenons. Concrètement, la préparation de commandes pour des clients tels que vous, permet de favoriser l’apprentissage d’un métier, de valoriser les personnes et de garantir une inclusion sociale et économique.

De ce fait, les achats que vous effectuez auprès de notre établissement vous permettent de participer à cet effort, j’imagine que vous comprenez le sens de ma mission Mme/M. Untel ; qu’en pensez-vous ?`,
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
    contenu: `Si je viens vers vous aujourd’hui, c’est pour vous offrir l’opportunité de vous compter parmi nos partenaires privilégiés et de contribuer à notre cause par le biais d’une commande de fournitures de bureau. Qu’est-ce qui vous est le plus utile, plutôt de la papeterie ou des produits d’hygiène ?`,
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
- On récapitule la commande et on annonce le tarif HT frais de port inclus.
- Validation coordonnées client.
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

Sans nouvelles de votre part dans les 10 minutes je me permettrai un rappel pour m’assurer de la bonne réception du bon de commande, c’est ok pour vous ?`,
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

Je me permettrai de vous rappeler à réception de la commande pour m’assurer que tout se sera bien passé. Entre-temps si vous avez des questions, n’hésitez pas à me contacter par mail ou par téléphone, vous trouverez toutes nos coordonnées sur le bon de commande.`,
    ordre_affichage: 70,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_plan: 8,
    id_campagne: 7,
    etape: 8,
    titre: 'CONTROLE SATISFACTION - Valider la satisfaction client après livraison',
    contenu: `Bonjour, je suis c’est Sophie LAGAGNE de l’ESAT Les Cigales, j’aimerais parler à Mme/M. Untel.

Bonjour Mme/M. Untel, c’est Sophie pour l’ESAT Les Cigales, vous vous souvenez de moi ? Comment allez-vous ? Vous avez dû recevoir votre commande ? Je viens m’assurer que la livraison s’est bien passée ?

Si non : J’en suis désolée, je vais reporter ces désagréments à l’atelier qui ne manquera pas de revenir vers vous pour trouver une solution, et je me permettrai un rappel pour m’assurer que le problème a été réglé.
(On arrête l’appel et on reprogramme un autre pour suivre le litige)

Si oui… : J’en suis ravie ! Pensez à faire savoir à vos collaborateurs que les produits qu’ils vont utiliser ont été conditionnés par des travailleurs en situation de handicap, je sais que les gens ont souvent à cœur de participer à la cause, et ça donnera une image très positive de votre entreprise.

Avant de vous laisser j’ai 2 faveurs à vous demander ? 1- Auriez-vous la gentillesse de mettre un avis positif sur le site internet de l’ESAT ? et 2- Dans combien de temps pensez-vous avoir consommé les articles, afin que je ne revienne pas vers vous trop tôt pour une future commande ?`,
    ordre_affichage: 80,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  }
];

export const MMA_PLAN_APPEL: PlanAppelEtape[] = [
  {
    id_plan: 101,
    id_campagne: 8,
    etape: 1,
    titre: 'IDENTIFICATION - Obtenir le nom du décisionnaire',
    contenu: `Bonjour, je suis Sophie LAGAGNE, j’aimerais parler au responsable de l’établissement mais je n’ai pas son nom, c’est Madame…Monsieur… ? Vous pouvez me le/la passer s’il vous plait ?

« C’est Pourquoi ? » : C’est Planète Assurances l’agence de MMA.

(si elle insiste :)

« Oui mais c’est à quel sujet ? » J’aimerais échanger avec lui au sujet de sa couverture d’assurance. Vous pouvez me la/le passer, s’il vous plait?`,
    ordre_affichage: 10,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 102,
    id_campagne: 8,
    etape: 2,
    titre: 'PRESENTATION - Se faire accepter par le décisionnaire',
    contenu: `Bonjour M/Mme… Je suis Sophie LAGAGNE, j’appelle pour l’agence MMA Planète Assurance. Comment allez-vous ?

MMA Planète Assurance, ça vous dit quelque chose ?

En quelques mots l’agence compte 4 agents généraux et 28 collaborateurs. Le siège est situé à Rochefort, nous accompagnons plus de 2000 professionnels à travers la France dans la gestion de leurs assurances.`,
    ordre_affichage: 20,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 103,
    id_campagne: 8,
    etape: 3,
    titre: 'DECOUVERTE - Comprendre l’environnement du client pour créer un lien',
    contenu: `Je suppose que vous avez déjà un prestataire, M/Mme Untel ; En êtes-vous satisfait ?

Si oui = Parfait, vous êtes prévoyant et c’est très important ! Mais avec le coût de l’assurance qui est en train de s’élever, avez-vous envisagé/pensé à réviser votre couverture récemment ?

Si non = De nombreux professionnels sont dans votre cas et se rendent-comptent parfois trop tard qu’ils sont mal couverts. C’est pourquoi nous vous proposons une alternative avec les services de MMA.`,
    ordre_affichage: 30,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 104,
    id_campagne: 8,
    etape: 4,
    titre: 'PROPOSITION - Obtenir un accord de principe',
    contenu: `Si je vous appelle aujourd’hui c’est pour vous savoir si vous seriez enclin à avoir un audit assurantiel d’une heure avec l’un de nos agents généraux ? Ça vous permettra de faire le point sur votre couverture, de découvrir nos solutions d’assurance et nos tarifs, et tout ça gratuitement ! Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 40,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 105,
    id_campagne: 8,
    etape: 5,
    titre: 'COMMANDE – Transformer l’accord de principe en RDV ferme',
    contenu: `Détection produit :
En matinée ou dans l’après-midi ?

Validation coordonnées client
Sachant qu’un agent se déplacera directement dans vos locaux, je vais avoir besoin de vérifier votre adresse :

Effectif entreprise
Et pour bien préparer votre rendez-vous, pouvez-vous m’indiquer l’effectif de la société ?

Date échéance contrat
Connaissez-vous, Mme/M Untel, la date d’échéance de vos contrats en cours ?

Nom concurrent
Et pour finir une dernière question : quel est votre prestataire actuel ?`,
    ordre_affichage: 50,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 106,
    id_campagne: 8,
    etape: 6,
    titre: 'RETOUR DE COMMANDE - Seulement si pas dispo sur créneaux définis',
    contenu: `Je vous propose de transmettre vos coordonnées à M.QUENTIN, notre Agent général, pour valider votre rendez-vous, ce dernier vous contactera en personne pour fixer une date avec vous, ce sera plus simple !

C’est ok pour vous ?`,
    ordre_affichage: 60,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 107,
    id_campagne: 8,
    etape: 7,
    titre: 'PRISE DE CONGE - Préparer le prochain appel et laisser une bonne image',
    contenu: `Je vous remercie du temps que vous m’avez accordé Mr/Mme Untel, j’ai bien noté le rendez-vous pour le (jour/mois/ heure). C’est Monsieur QUENTIN, l’agent général de PLANETE ASSURANCE, qui viendra vous rencontrer en personne. Je lui demande de prendre contact avec vous afin de confirmer le rendez-vous.

Je me permettrai de vous rappeler après le rendez-vous pour m’assurer que tout se sera bien passé.`,
    ordre_affichage: 70,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_plan: 108,
    id_campagne: 8,
    etape: 8,
    titre: 'CONTROLE SATISFACTION - Valider la satisfaction client après le RDV',
    contenu: `Bonjour, je suis c’est Sophie Lagagne de MMA Planète Assurance, j’aimerais parler à Mme/M. Untel.

Bonjour Mme/M Untel, c’est Julie LAGAGNE pour MMA Planète Assurance. Je voulais m’assurer que le RDV de (jour/heure) avec Monsieur QUENTIN s’était bien passé ?

Si non : J’en suis désolée, je vais reporter ces désagréments à l’agence.

Si oui… : J’en suis ravie ! C’est parfait, je vous laisse poursuivre avec lui s’il devait vous rester des interrogations, et je vous souhaite une très belle journée.`,
    ordre_affichage: 80,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  }
];
