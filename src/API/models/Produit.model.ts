import type { Produit } from '../../utils/types';

export class ProduitModel {
  private data: Produit;

  constructor(data: Produit) {
    this.data = data;
  }

  get id(): number {
    return this.data.id_produit;
  }

  get nom(): string {
    return this.data.nom_produit;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get prixBase(): number {
    return this.data.prix_base;
  }

  get actif(): boolean {
    return this.data.actif;
  }

  get attributsSpecifiques(): Record<string, any> | undefined {
    return this.data.attributs_specifiques;
  }

  public toJSON(): Produit {
    return { ...this.data };
  }

  public static fromJSON(data: Produit): ProduitModel {
    return new ProduitModel(data);
  }
}
