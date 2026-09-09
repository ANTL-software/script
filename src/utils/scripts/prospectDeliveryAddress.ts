/** The prospect has a single delivery text field. Only split its explicit "street, postcode city" format. */
export function getProspectDeliveryPrefill(prospect: { adresse_livraison?: string | null; code_postal?: string | null; ville?: string | null } | null): { adresse: string; code_postal: string; ville: string } {
  const address = prospect?.adresse_livraison?.trim() || '';
  const match = address.match(/^(.+),\s*(\d{5})\s+([\p{L}\s'’.-]+)$/u);
  return { adresse: match?.[1] ?? address, code_postal: match?.[2] ?? prospect?.code_postal ?? '', ville: match?.[3] ?? prospect?.ville ?? '' };
}
