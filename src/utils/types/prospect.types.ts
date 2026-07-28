export type ProspectType = 'Particulier' | 'Entreprise';

export type ProspectStatut =
  | 'nouveau'
  | 'contacte'
  | 'interesse'
  | 'rappel'
  | 'non_interesse'
  | 'vente_conclue';

export type TypeFiche = 'jamais_appele' | 'deja_appele' | 'recycle' | 'client';

export type ProspectRelationCommercialeCampagneStatut = 'prospect' | 'client' | 'lead_genere';

export interface ProspectRelationCommercialeCampagne {
  id_relation?: number;
  id_prospect?: number;
  id_campagne?: number;
  statut_relation: ProspectRelationCommercialeCampagneStatut;
  origine: 'vente_validee' | 'lead_cree' | null;
  id_source: number | null;
  date_relation: string | null;
  campagne?: {
    id_campagne: number;
    nom_campagne: string;
    type_campagne?: string | null;
  };
}

export interface Prospect {
  id_prospect: number;
  type_prospect: ProspectType;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  email?: string;
  nom_contact?: string;
  telephone: string;
  adresse_facturation?: string;   // Renommé depuis 'adresse' (2026-06-02)
  adresse_livraison?: string;     // NOUVEAU (2026-06-02)
  code_postal?: string;
  ville?: string;
  pays?: string;
  statut: ProspectStatut;
  relation_commerciale_campagne?: ProspectRelationCommercialeCampagne | null;
  relations_commerciales?: ProspectRelationCommercialeCampagne[];
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
  decisionnaire_nom?: string;
  decisionnaire_fonction?: string;
  decisionnaire_email_pro?: string;
  max_progpa: number;
  max_progpa_campagne?: number;
  max_progpa_commercial_campagne?: number;
  grille_tarifaire_envoyee_at?: string | null;
  id_campagne?: number | null;
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
  nom_contact?: string;
  decisionnaire_nom?: string;
  decisionnaire_fonction?: string;
  decisionnaire_email_pro?: string;
}
