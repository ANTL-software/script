import type { Produit } from '../../utils/types';

export class ProduitModel {
  private data: Produit;

  constructor(data: Produit) {
    // Convertir les prix en nombres si ce sont des strings
    this.data = {
      ...data,
      prix_unitaire: data.prix_unitaire ? parseFloat(String(data.prix_unitaire)) : undefined,
      prix_promo: data.prix_promo ? parseFloat(String(data.prix_promo)) : undefined,
      tarif: data.tarif ? {
        ...data.tarif,
        prix_unitaire: data.tarif.prix_unitaire ? parseFloat(String(data.tarif.prix_unitaire)) : undefined,
        prix_promo: data.tarif.prix_promo ? parseFloat(String(data.tarif.prix_promo)) : undefined,
      } : undefined
    };
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

  get prixUnitaire(): number | undefined {
    return typeof this.data.prix_unitaire === 'number' ? this.data.prix_unitaire : undefined;
  }

  get prixPromo(): number | undefined {
    return typeof this.data.prix_promo === 'number' ? this.data.prix_promo : undefined;
  }

  get actif(): boolean {
    return this.data.actif;
  }

  get attributsSpecifiques(): Record<string, unknown> | undefined {
    return this.data.attributs_specifiques;
  }

  public toJSON(): Produit {
    return { ...this.data };
  }

  public static fromJSON(data: Produit): ProduitModel {
    return new ProduitModel(data);
  }
}
