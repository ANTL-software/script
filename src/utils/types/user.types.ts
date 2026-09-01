export interface Poste {
  id_poste: number;
  libelle_poste: string;
  description?: string;
  salaire_base?: number;
  niveau_hierarchique?: number;
  type_poste?: 'direction' | 'commercial' | 'support' | 'rh' | 'technique' | 'adv' | 'autre' | null;
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
  id_rang_commercial?: number | null;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
  poste?: Poste;
  departement?: Departement;
  appels_script_bloques?: boolean;
  motif_blocage_appels_script?: string | null;
  appels_script_bloques_at?: string | null;
  appels_script_bloques_jusqu_au?: string | null;
  appels_script_bloques_par?: number | null;
}

export interface LoginCredentials {
  identifiant: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    employe: Employe;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: Employe;
}

export interface TestSessionTicket {
  ticket: string;
  expires_in: number;
  id_campagne_active: number;
}

export interface TestSessionExchange {
  employe: Employe;
  id_campagne_active: number;
}
