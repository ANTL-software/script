import type { Prospect, ProspectType, ProspectStatut, TypeFiche } from '../../utils/types';

export class ProspectModel {
  private data: Prospect;

  constructor(data: Prospect) {
    this.data = data;
  }

  get id(): number {
    return this.data.id_prospect;
  }

  get nom(): string {
    return this.data.nom;
  }

  get prenom(): string | undefined {
    return this.data.prenom;
  }

  get fullName(): string {
    if (this.data.type_prospect === 'Entreprise' && this.data.raison_sociale) {
      return this.data.raison_sociale;
    }
    return this.data.prenom
      ? `${this.data.prenom} ${this.data.nom}`
      : this.data.nom;
  }

  get telephone(): string {
    return this.data.telephone;
  }

  get email(): string | undefined {
    return this.data.email;
  }

  get ville(): string | undefined {
    return this.data.ville;
  }

  get statut(): ProspectStatut {
    return this.data.statut;
  }

  get typeProspect(): ProspectType {
    return this.data.type_prospect;
  }

  get typeFiche(): TypeFiche {
    if (this.data.statut === 'vente_conclue') {
      return 'client';
    }
    if (this.data.statut === 'nouveau') {
      return 'jamais_appele';
    }
    if (this.data.statut === 'non_interesse') {
      return 'recycle';
    }
    return 'deja_appele';
  }

  public toJSON(): Prospect {
    return { ...this.data };
  }

  public static fromJSON(data: Prospect): ProspectModel {
    return new ProspectModel(data);
  }
}
