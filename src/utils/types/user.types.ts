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
}

export interface LoginCredentials {
  email: string;
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