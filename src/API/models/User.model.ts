import type { Employe, Poste, Departement } from '../../utils/types';

export class UserModel implements Employe {
  id_employe: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_embauche?: string;
  id_poste?: number;
  id_departement?: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  Poste?: Poste;
  Departement?: Departement;

  constructor(data: Employe) {
    this.id_employe = data.id_employe;
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.email = data.email;
    this.telephone = data.telephone;
    this.date_embauche = data.date_embauche;
    this.id_poste = data.id_poste;
    this.id_departement = data.id_departement;
    this.actif = data.actif;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.Poste = data.Poste;
    this.Departement = data.Departement;
  }

  public get fullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  public toJSON(): Employe {
    return {
      id_employe: this.id_employe,
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      telephone: this.telephone,
      date_embauche: this.date_embauche,
      id_poste: this.id_poste,
      id_departement: this.id_departement,
      actif: this.actif,
      created_at: this.created_at,
      updated_at: this.updated_at,
      Poste: this.Poste,
      Departement: this.Departement,
    };
  }

  public static fromJSON(data: Employe): UserModel {
    return new UserModel(data);
  }

  public static fromLocalStorage(): UserModel | null {
    try {
      const employeData = localStorage.getItem('employe');
      if (!employeData) return null;

      const data = JSON.parse(employeData) as Employe;
      return new UserModel(data);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }

  public saveToLocalStorage(): void {
    try {
      localStorage.setItem('employe', JSON.stringify(this.toJSON()));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  }

  public static clearFromLocalStorage(): void {
    localStorage.removeItem('employe');
  }
}
