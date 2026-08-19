import type { Employe, Poste, Departement } from '../../utils/types';

export class UserModel implements Employe {
  id_employe: number;
  identifiant: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  date_embauche?: string;
  id_poste?: number;
  id_departement?: number;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  poste?: Poste;
  departement?: Departement;
  appels_script_bloques: boolean;
  motif_blocage_appels_script?: string | null;
  appels_script_bloques_at?: string | null;
  appels_script_bloques_jusqu_au?: string | null;
  appels_script_bloques_par?: number | null;

  constructor(data: Employe) {
    this.id_employe = data.id_employe;
    this.identifiant = data.identifiant;
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
    this.poste = data.poste;
    this.departement = data.departement;
    this.appels_script_bloques = data.appels_script_bloques ?? false;
    this.motif_blocage_appels_script = data.motif_blocage_appels_script ?? null;
    this.appels_script_bloques_at = data.appels_script_bloques_at ?? null;
    this.appels_script_bloques_jusqu_au = data.appels_script_bloques_jusqu_au ?? null;
    this.appels_script_bloques_par = data.appels_script_bloques_par ?? null;
  }

  public get fullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  public toJSON(): Employe {
    return {
      id_employe: this.id_employe,
      identifiant: this.identifiant,
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
      poste: this.poste,
      departement: this.departement,
      appels_script_bloques: this.appels_script_bloques,
      motif_blocage_appels_script: this.motif_blocage_appels_script,
      appels_script_bloques_at: this.appels_script_bloques_at,
      appels_script_bloques_jusqu_au: this.appels_script_bloques_jusqu_au,
      appels_script_bloques_par: this.appels_script_bloques_par,
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
