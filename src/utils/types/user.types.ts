export interface Poste {
  id_poste: number;
  libelle_poste: string;
  description?: string;
  salaire_base?: number;
  niveau_hierarchique?: number;
}

export interface Departement {
  id_departement: number;
  nom_departement: string;
  budget?: number;
  id_responsable?: number;
}

export interface Employe {
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
}

export interface LoginCredentials {
  identifiant: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    employe: Employe;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: Employe;
}