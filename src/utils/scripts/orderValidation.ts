interface OrderFormData {
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  mode_paiement: string;
  notes: string;
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

  if (!formData.adresse.trim()) errors.adresse = "L'adresse est obligatoire";
  if (!formData.code_postal.trim()) {
    errors.code_postal = 'Le code postal est obligatoire';
  } else if (!/^\d{5}$/.test(formData.code_postal)) {
    errors.code_postal = 'Le code postal doit contenir 5 chiffres';
  }
  if (!formData.ville.trim()) errors.ville = 'La ville est obligatoire';
  if (!formData.pays.trim()) errors.pays = 'Le pays est obligatoire';

  return errors;
}

/**
 * Construit le payload de vente à partir des données du formulaire et du panier.
 */
export function buildVentePayload(params: {
  prospectId: number;
  campagneId: number;
  formData: OrderFormData;
  items: Array<{ produit: { id_produit: number }; quantite: number; prix_unitaire: number; remise: number }>;
}) {
  const { prospectId, campagneId, formData, items } = params;
  return {
    id_prospect: prospectId,
    id_campagne: campagneId,
    mode_paiement: formData.mode_paiement,
    notes: formData.notes.trim() || undefined,
    details: items.map(item => ({
      id_produit: item.produit.id_produit,
      quantite: item.quantite,
      prix_unitaire: item.prix_unitaire,
      remise: item.remise,
    })),
  };
}
