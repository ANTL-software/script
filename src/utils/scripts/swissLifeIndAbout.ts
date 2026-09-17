import type { Campaign } from '../types/campaign.types';

const SWISS_LIFE_IND_CAMPAIGN_ID = 14;

export const SWISS_LIFE_IND_ABOUT = {
  subtitle: 'Présentation de Swiss Life',
  introduction: 'Présente en France depuis 1898, Swiss Life est un acteur référent en assurance et gestion de patrimoine qui propose une approche globale en assurance vie, banque privée, gestion financière, santé, prévoyance et dommages.',
  agency: {
    title: 'Où nous trouver ?',
    lines: [
      'Agence d’Assurance Swiss Life Périgny',
      'Fabrice Belin & David Pieuchot',
      '5, Avenue Louis Lumière',
      '17180 PÉRIGNY',
      'N° ORIAS : 070065 - www',
    ],
  },
  products: {
    title: 'Nos produits d’assurances',
    introduction: 'Les services et solutions de Swiss Life France se structurent autour de cinq grands domaines :',
    items: [
      'Gestion de Patrimoine & Banque Privée',
      'Retraite & Épargne',
      'Santé & Complémentaire Maladie',
      'Prévoyance & Assurance Emprunteur',
    ],
  },
  commitments: {
    title: 'Nos engagements',
    content: 'L’Agence propose des services de protection sociale du dirigeant et de ses salariés, d’assurance vie, de complémentaire santé et d’épargne salariale. Avec Fabrice BELIN fort de 25 ans d’expérience chez Swiss Life et David Pieuchot, avocat d’affaire fiscaliste pendant 15 ans, les clients bénéficierez d’un accompagnement personnalisé et de solutions adaptées à leurs besoins. Faire confiance à leur expertise, c’est assurer son avenir financier en toute sérénité.',
  },
  keyFigures: {
    title: 'Chiffres clés',
    content: 'Swiss Life, c’est 2,1 millions de clients et adhérents, dont plus de 225 1000 particuliers aisés et patrimoniaux, et 265 400 chefs d’entreprise et travailleurs non-salariés.',
  },
  objective: {
    title: 'Objectif',
    content: 'Prise de RDV qualifiés en présentant l’expertise de Swiss Life',
    strengthTitle: 'Point fort pour fixer les RDV :',
    strengths: [
      'Rdv gratuit avec l’un des gérants pour audit assurantiel',
      'Swiss Life est un acteur majeur de l’assurance et de la mutuelle en France et sur notre département.',
    ],
  },
} as const;

export function isSwissLifeIndCampaign(
  campaign?: Pick<Campaign, 'id_campagne' | 'nom_campagne'> | null,
): boolean {
  if (Number(campaign?.id_campagne) === SWISS_LIFE_IND_CAMPAIGN_ID) {
    return true;
  }

  return campaign?.nom_campagne?.toLowerCase().includes('swiss life ind') ?? false;
}
