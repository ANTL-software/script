import type { Campaign } from '../types/campaign.types';

const CREANTL_CAMPAIGN_ID = 15;

export const CREANTL_ABOUT = {
  subtitle: 'Présentation de Creantl',
  introduction: 'Spécialiste de l’Expérience client, antl propose des solutions sur mesure aux TPE et PME qui souhaitent optimiser leur performance commerciale et améliorer leur service client. Fortes d’une expérience de 15 ans dans la relation client, ses équipes accompagnent les clients dans la réduction de leurs coûts opérationnels, par l’externalisation de leur force de vente et la redéfinition de leur stratégie de communication.',
  agency: {
    title: 'Où nous trouver ?',
    lines: [
      'Adresse de l’agence :',
      '48Bis, Avenue Charles de Gaulle',
      '17300 ROCHEFORT',
    ],
    website: 'https://antl.com/',
  },
  services: {
    title: 'Nos services',
    introduction: 'Les services et solutions d’antl se structurent autour de six grands domaines :',
    items: [
      'Conquête : acquisition de nouveaux marchés/clients',
      'Fidélisation : de clients existants',
      'Rétention : de clients « endormis » ou insatisfaits',
      'Conception : génération d’outils administratifs, CR, intégration IA',
      'Visibilité online : création et animation de sites internet et réseaux sociaux',
      'Branding : communication et optimisation de l’image de marque',
    ],
  },
  commitments: {
    title: 'Nos engagements',
    content: 'L’Agence propose des services pour booster la performance commerciale en transformant l’Expérience client en levier de croissance. Notre mission est de créer un lien qui a du sens en établissant une proximité respectueuse avec les interlocuteurs de nos partenaires. Nous intervenons à chaque étape du cycle de vie du client, pour générer durablement de l’engagement et de la valeur.',
  },
  objective: {
    title: 'Objectif',
    content: 'Prise de RDV qualifiés en présentant l’expertise de Swiss Life',
    strengthTitle: 'Point fort pour fixer les RDV :',
    strengths: [
      'Rdv gratuit pour étudier le besoin de l’entreprise',
      'Adaptation flexible pour proposer une solution sur mesure',
    ],
  },
} as const;

export function isCreantlCampaign(
  campaign?: Pick<Campaign, 'id_campagne' | 'nom_campagne'> | null,
): boolean {
  return Number(campaign?.id_campagne) === CREANTL_CAMPAIGN_ID
    || campaign?.nom_campagne?.toLowerCase().includes('creantl') === true;
}
