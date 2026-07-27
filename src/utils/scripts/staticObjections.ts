import type { Objection } from '../types';

export const CIGALES_OBJECTIONS: Objection[] = [
  {
    id_objection: 1,
    id_campagne: 7,
    categorie: 'Prix',
    titre: 'Trop Cher',
    texte_objection: `Nos tarifs vous semblent un plus élevés que vos offres habituelles c'est ça ?`,
    reformulation: `Oui effectivement, nos tarifs paraissent plus élevés que le marché.`,
    adaptation: `Ca s'explique par le fait que nos usagers sont accompagnés par toute une équipe pédagogique et psychologique. Ce que vous payez s'inscrit dans l'organisation de toute une structure médico-sociale.`,
    texte_reponse: `C'est pour ça qu'aujourd'hui je ne vous parle pas de bonne affaire mais de bonne action.`,
    ordre_affichage: 1,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_objection: 2,
    id_campagne: 7,
    categorie: 'Timing',
    titre: 'Pas le temps / pas le moment',
    texte_objection: `Je tombe mal c'est ça ?`,
    reformulation: `J'en suis navrée, je me doute que vous êtes en plein travail, c'est aussi mon cas.`,
    adaptation: `Pas facile de toujours tomber au bon moment, c'est pour ça que je ne vous prendrai que très peu de temps.`,
    texte_reponse: `Je prends un court instant pour vous expliquer notre démarche.`,
    ordre_affichage: 2,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  },
  {
    id_objection: 3,
    id_campagne: 7,
    categorie: 'Concurrence',
    titre: 'Engagé ailleurs',
    texte_objection: `Vous avez déjà un fournisseur, c'est ça ?`,
    reformulation: `C'est normal, d'ailleurs toutes les entreprises qui nous soutiennent ont déjà leurs habitudes.`,
    adaptation: `D'ailleurs je ne viens pas m'y substituer, ce que je vous propose, c'est une démarche différente qui va donner encore plus de sens à vos achats.`,
    texte_reponse: `Notre partenariat apporte une vraie valeur sociale.`,
    ordre_affichage: 3,
    actif: true,
    created_at: '2026-06-09T00:00:00.000Z',
    updated_at: '2026-06-09T00:00:00.000Z'
  }
];

export const MMA_OBJECTIONS: Objection[] = [
  {
    id_objection: 101,
    id_campagne: 8,
    categorie: 'PRESTATAIRE',
    titre: 'Intérêt (Pas le temps / pas le moment)',
    texte_objection: 'Intérêt (Pas le temps / pas le moment)',
    reformulation: `Ce que vous me dites, c’est que votre planning est déjà bien chargé, c’est ça?`,
    adaptation: `C’est tout à fait légitime, le temps est la ressource la plus précieuse d'un professionnel. Alors rassurez-vous, l'objectif n'est pas de vous surcharger, mais au contraire de vous faire gagner du temps sur la gestion de vos risques ;`,
    texte_reponse: `C’est précisément pour ça que je vous propose de fixer un rendez-vous directement avec l’un de nos agents. Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 1,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 102,
    id_campagne: 8,
    categorie: 'FOURNISSEURS',
    titre: 'Engagé ailleurs',
    texte_objection: 'Engagé ailleurs',
    reformulation: `Vous me dites que vous avez déjà un partenaire de confiance qui gère les contrats de votre entreprise c’est bien ça ?`,
    adaptation: `C’est une excellente chose, la stabilité est essentielle pour la sécurité d'une activité professionnelle. Mon but n'est pas de remettre en cause cette relation.`,
    texte_reponse: `En revanche, compte-tenu du paysage réglementaire et des risques professionnels qui évoluent très vite. Rencontrer notre Agent Général pour un second regard gratuit vous permettra, soit de valider que vous êtes parfaitement couvert, soit de découvrir des pistes d'optimisation. Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 2,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 103,
    id_campagne: 8,
    categorie: 'QUALITE',
    titre: 'Pas par tél / RDV présentiel',
    texte_objection: 'Pas par tél / RDV présentiel',
    reformulation: `Qu’est-ce qui vous freine, vous avez peur que le rendez-vous ne soit pas à la hauteur de vos espérances ?`,
    adaptation: `Je comprends votre réticence si vous avez été déçu par le passé, d’autant que nous ne nous connaissons pas.`,
    texte_reponse: `Nos agents généraux sont eux aussi des gérants et connaissent parfaitement les difficultés que vous pouvez rencontrer. Ce que je vous propose aujourd’hui c’est un audit assurantiel avec l’un d’entre eux, et le point positif c’est que c’est totalement gratuit ! Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 3,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 104,
    id_campagne: 8,
    categorie: 'BESOIN',
    titre: 'Pas par tél / RDV présentiel',
    texte_objection: 'Pas par tél / RDV présentiel',
    reformulation: `Vous voulez dire que vous n’avez pas besoin d’un audit ?`,
    adaptation: `Je comprends vous êtes satisfait des prestations proposées par votre assureur, encore une fois, c’est très important. Comme je vous le disais de nombreux professionnels se rendent compte parfois trop tard qu’ils sont mal couverts.`,
    texte_reponse: `L’audit que nous vous proposons ne vous engage à rien mais vous permet de comparer avec l’un de nos agents généraux votre offre actuelle et nos solutions assurantielles, et ce, sans débourser d’argent. C’est une proposition très intéressante! Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 4,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 105,
    id_campagne: 8,
    categorie: 'CONTACT',
    titre: 'Pas par tél / RDV présentiel',
    texte_objection: 'Pas par tél / RDV présentiel',
    reformulation: `C’est que vous ne prenez aucune décision par téléphone c’est ça ?`,
    adaptation: `Je comprends votre réticence, surtout par les temps qui courent et une démarche téléphonique ne serait pas sérieuse.`,
    texte_reponse: `Ce que je vous propose aujourd’hui, c’est un audit assurantiel avec l’un de nos agents généraux qui se déplacera dans vos locaux, cela ne prendra qu’une heure, il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 5,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 106,
    id_campagne: 8,
    categorie: 'CONTACT',
    titre: 'Par mail/catalogue',
    texte_objection: 'Par mail/catalogue',
    reformulation: `Vous souhaitez recevoir un descriptif écrit afin de pouvoir étudier nos solutions à tête reposée, c’est ça ?`,
    adaptation: `Je comprends bien. Toutefois, chaque structure a des besoins spécifiques et une simple plaquette commerciale ne reflétera pas la réalité de votre entreprise.`,
    texte_reponse: `Pour que les informations soient en cohérence avec à votre activité, notre Agent Général doit analyser votre profil. Je vous propose un entretien personnalisé pour poser les bases de cette étude sur-mesure. Il nous reste des créneaux Mardi xx et Jeudi xx, qu’est-ce qui vous convient le mieux ?`,
    ordre_affichage: 6,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  },
  {
    id_objection: 107,
    id_campagne: 8,
    categorie: 'SIEGE',
    titre: 'Marché publics/siège',
    texte_objection: 'Marché publics/siège',
    reformulation: `Toutes les décisions concernant vos assurances sont prise par vôtre siège ?`,
    adaptation: `Effectivement bon nombre de grandes entreprises et d’administrations fonctionnent ainsi ?`,
    texte_reponse: `Pourriez-vous m’orienter vers votre siège ?`,
    ordre_affichage: 7,
    actif: true,
    created_at: '2026-07-02T00:00:00.000Z',
    updated_at: '2026-07-02T00:00:00.000Z'
  }
];

