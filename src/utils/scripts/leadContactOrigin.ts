export const LEAD_CONTACT_ORIGIN_OPTIONS = [
  {
    "value": "telephone",
    "label": "Prospection téléphonique"
  },
  {
    "value": "demarchage_pied",
    "label": "Démarchage à pied"
  },
  {
    "value": "reseau_social",
    "label": "Réseau social"
  },
  {
    "value": "site_web",
    "label": "Site web antl"
  },
  {
    "value": "moteur_recherche",
    "label": "Moteur de recherche"
  },
  {
    "value": "publicite_en_ligne",
    "label": "Publicité en ligne"
  },
  {
    "value": "email",
    "label": "Email / newsletter"
  },
  {
    "value": "bouche_a_oreille",
    "label": "Bouche-à-oreille"
  },
  {
    "value": "recommandation_client",
    "label": "Recommandation d’un client"
  },
  {
    "value": "partenaire",
    "label": "Partenaire / apporteur d’affaires"
  },
  {
    "value": "reseau_professionnel",
    "label": "Réseau professionnel"
  },
  {
    "value": "salon_evenement",
    "label": "Salon / événement"
  },
  {
    "value": "courrier",
    "label": "Courrier postal"
  },
  {
    "value": "flyer",
    "label": "Flyer / brochure"
  },
  {
    "value": "presse",
    "label": "Presse / média"
  },
  {
    "value": "client_existant",
    "label": "Déjà client antl"
  },
  {
    "value": "autre",
    "label": "Autre"
  },
  {
    "value": "non_precise",
    "label": "Non précisé"
  }
];
export function getLeadContactOriginLabel(value?: string | null): string {
  return LEAD_CONTACT_ORIGIN_OPTIONS.find((option) => option.value === value)?.label ?? "Non renseigné";
}
