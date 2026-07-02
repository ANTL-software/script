export interface ProspectOptoutPayload {
  id_campagne: number;
}

export const buildProspectOptoutPayload = (campagneId: number): ProspectOptoutPayload => ({
  id_campagne: campagneId,
});
