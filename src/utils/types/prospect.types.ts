export type ProspectType = 'Particulier' | 'Entreprise';

export type ProspectStatut =
  | 'nouveau'
  | 'contacte'
  | 'interesse'
  | 'rappel'
  | 'non_interesse'
  | 'vente_conclue';

export type TypeFiche = 'jamais_appele' | 'deja_appele' | 'recycle' | 'client';

export interface Prospect {
  id_prospect: number;
  type_prospect: ProspectType;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  email?: string;
  telephone: string;
  adresse_facturation?: string;   // Renommé depuis 'adresse' (2026-06-02)
  adresse_livraison?: string;     // NOUVEAU (2026-06-02)
  code_postal?: string;
  ville?: string;
  pays?: string;
  statut: ProspectStatut;
  statut_global?: ProspectStatut;
  statut_campagne?: ProspectStatut | null;
  notes?: string;
  siret?: string;
  code_naf?: string;
  activite?: string;
  secteur?: string;
  region?: string;
  civilite?: string;
  telephone_contact?: string;
  max_progpa: number;
  grille_tarifaire_envoyee_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectInfos {
  nom: string;
  prenom?: string;
  telephone: string;
  email?: string;
  ville?: string;
  typeFiche: TypeFiche;
}

export interface UpdateProspectData {
  nom?: string;
  prenom?: string;
  email?: string;
  adresse_facturation?: string;    // Renommé depuis 'adresse' (2026-06-02)
  adresse_livraison?: string;       // NOUVEAU (2026-06-02)
  code_postal?: string;
  ville?: string;
  pays?: string;
  notes?: string;
  siret?: string;
  code_naf?: string;
  activite?: string;
  secteur?: string;
  region?: string;
  civilite?: string;
  telephone_contact?: string;
}
