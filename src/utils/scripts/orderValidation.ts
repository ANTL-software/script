import type { ModePaiement, DelaisLivraison, CartItem, CreateVenteData } from '../types';

interface OrderFormData {
  adresse_facturation: string;
  adresse_livraison: string;
  code_postal_facturation: string;
  code_postal_livraison: string;
  ville_facturation: string;
  ville_livraison: string;
  pays_facturation: string;
  pays_livraison: string;
  meme_adresse: boolean;
  mode_paiement: string;
  notes: string;
  siret?: string;
  email?: string;
  raison_sociale?: string;
  delais_livraison: DelaisLivraison;
  civilite: string;
  nom_contact: string;
  plage_horaire_livraison: string;
  livraison_offerte: boolean;
}

export interface OrderValidationErrors {
  [key: string]: string;
}

/**
 * Valide les champs du formulaire de commande.
 * Retourne un objet d'erreurs (vide si valide).
 */
export function validateOrderForm(formData: OrderFormData): OrderValidationErrors {
  const errors: OrderValidationErrors = {};

  // Validation de l'adresse de facturation (toujours obligatoire)
  if (!formData.adresse_facturation.trim()) errors.adresse_facturation = "L'adresse de facturation est obligatoire";
  if (!formData.code_postal_facturation.trim()) {
    errors.code_postal_facturation = 'Le code postal de facturation est obligatoire';
  } else if (!/^\d{5}$/.test(formData.code_postal_facturation)) {
    errors.code_postal_facturation = 'Le code postal doit contenir 5 chiffres';
  }
  if (!formData.ville_facturation.trim()) errors.ville_facturation = 'La ville de facturation est obligatoire';
  if (!formData.pays_facturation.trim()) errors.pays_facturation = 'Le pays de facturation est obligatoire';

  // Validation de l'adresse de livraison (seulement si différente de l'adresse de facturation)
  if (!formData.meme_adresse) {
    if (!formData.adresse_livraison.trim()) errors.adresse_livraison = "L'adresse de livraison est obligatoire";
    if (!formData.code_postal_livraison.trim()) {
      errors.code_postal_livraison = 'Le code postal de livraison est obligatoire';
    } else if (!/^\d{5}$/.test(formData.code_postal_livraison)) {
      errors.code_postal_livraison = 'Le code postal doit contenir 5 chiffres';
    }
    if (!formData.ville_livraison.trim()) errors.ville_livraison = 'La ville de livraison est obligatoire';
    if (!formData.pays_livraison.trim()) errors.pays_livraison = 'Le pays de livraison est obligatoire';
  }

  // Validation du contact (toujours obligatoire)
  if (!formData.civilite.trim()) {
    errors.civilite = "La civilité du contact est obligatoire";
  }
  if (!formData.nom_contact.trim()) {
    errors.nom_contact = "Le nom du contact est obligatoire";
  }

  return errors;
}

/**
 * Construit le payload de vente à partir des données du formulaire et du panier.
 */
export function buildVentePayload(params: {
  prospectId: number;
  campagneId: number;
  formData: OrderFormData;
  items: CartItem[];
}): CreateVenteData {
  const { prospectId, campagneId, formData, items } = params;

  // Déterminer l'adresse de livraison à utiliser
  const adresseLivraison = formData.meme_adresse
    ? formData.adresse_facturation
    : formData.adresse_livraison;
  const codePostalLivraison = formData.meme_adresse
    ? formData.code_postal_facturation
    : formData.code_postal_livraison;
  const villeLivraison = formData.meme_adresse
    ? formData.ville_facturation
    : formData.ville_livraison;
  const paysLivraison = formData.meme_adresse
    ? formData.pays_facturation
    : formData.pays_livraison;

  return {
    id_prospect: prospectId,
    id_campagne: campagneId,
    mode_paiement: formData.mode_paiement as ModePaiement,
    delais_livraison: formData.delais_livraison,
    notes: formData.notes.trim() || undefined,
    adresse_facturation: formData.adresse_facturation.trim(),
    adresse_livraison: adresseLivraison.trim(),
    code_postal_facturation: formData.code_postal_facturation.trim(),
    code_postal_livraison: codePostalLivraison.trim(),
    ville_facturation: formData.ville_facturation.trim(),
    ville_livraison: villeLivraison.trim(),
    pays_facturation: formData.pays_facturation.trim(),
    pays_livraison: paysLivraison.trim(),
    livraison_offerte: formData.livraison_offerte,
    plage_horaire_livraison: formData.plage_horaire_livraison.trim() || undefined,
    details: items.map(item => {
      const baseDetail = {
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise: item.remise,
      };
      if (item.item_type === 'panier') {
        return {
          ...baseDetail,
          id_panier: item.id_panier_line,
        };
      }

      return {
        ...baseDetail,
        id_produit: item.produit.id_produit,
      };
    }),
  };
}
