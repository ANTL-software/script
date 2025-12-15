import type { Campaign } from '../../utils/types';

export class CampaignModel {
  private data: Campaign;

  constructor(data: Campaign) {
    this.data = data;
  }

  get id(): number {
    return this.data.id_campagne;
  }

  get nom(): string {
    return this.data.nom_campagne;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get actif(): boolean {
    return this.data.actif;
  }

  get dateDebut(): string {
    return this.data.date_debut;
  }

  get dateFin(): string | undefined {
    return this.data.date_fin;
  }

  public toJSON(): Campaign {
    return { ...this.data };
  }

  public static fromJSON(data: Campaign): CampaignModel {
    return new CampaignModel(data);
  }
}
