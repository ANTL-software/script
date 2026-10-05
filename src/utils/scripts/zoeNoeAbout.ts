import type { Campaign } from '../types/campaign.types';

const ZOE_NOE_CAMPAIGN_ID = 13;

export const ZOE_NOE_ABOUT = {
  subtitle: 'Présentation de Zoenoe',
  introduction: 'Chargée de Communication externalisée, Zoé CAILLIBOTE, freelance en webmarketing et communication accompagne les entrepreneurs, les PME et les associations dans leur quotidien, dans l’amélioration de leur image, leur communication et leur visibilité.',
  agency: {
    title: 'Où nous trouver ?',
    lines: [
      'Adresse de l’agence :',
      '1, Rue Prise Louis Lumière',
      '17700 SAINT SATURNIN DES BOIS',
    ],
    website: 'https://zoenoe.com/',
  },
  services: {
    title: 'Nos services',
    introduction: 'Les services et solutions de Zoenoe:',
    items: [
      'Communication : création de supports et analyse',
      'Visibilité : création et stratégie',
      'Gestion de projet : coordination équipes, plannings et budgets',
      'Site Internet : création et stratégie',
    ],
  },
  objective: {
    title: 'Objectif',
    content: 'Prise de RDV qualifiés pour Audit:',
    strengthTitle: 'Point fort pour fixer les RDV :',
    strengths: [
      'Audit gratuit avec Zoenoe',
      'RDV à distance',
    ],
  },
} as const;

export function isZoeNoeCampaign(
  campaign?: Pick<Campaign, 'id_campagne' | 'nom_campagne'> | null,
): boolean {
  if (Number(campaign?.id_campagne) === ZOE_NOE_CAMPAIGN_ID) {
    return true;
  }

  const normalizedName = campaign?.nom_campagne
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim() ?? '';

  return normalizedName === 'zoenoe' || (normalizedName.includes('zoe') && normalizedName.includes('noe'));
}
