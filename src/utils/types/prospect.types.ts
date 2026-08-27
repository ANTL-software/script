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

export type CommercialFollowupType = 'vente' | 'lead';

export interface CommercialFollowup {
  type: CommercialFollowupType;
  id_source: number;
  id_appel_source: number | null;
  statut: string;
  date_creation: string | null;
}

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
  raison_sociale_livraison?: string;
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
  suivi_commercial_en_cours?: CommercialFollowup | null;
  grille_tarifaire_envoyee_at?: string | null;
  plaquette_envoyee_at?: string | null;
  accroche?: string;
  poste_ouvert?: string;
  linkedin?: string | null;
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
  prenom?: string | null;
  raison_sociale?: string | null;
  raison_sociale_livraison?: string | null;
  email?: string | null;
  adresse_facturation?: string | null;    // Renommé depuis 'adresse' (2026-06-02)
  adresse_livraison?: string | null;       // NOUVEAU (2026-06-02)
  code_postal?: string | null;
  ville?: string | null;
  pays?: string | null;
  notes?: string | null;
  siret?: string | null;
  code_naf?: string | null;
  activite?: string | null;
  secteur?: string | null;
  region?: string | null;
  civilite?: string | null;
  telephone_contact?: string | null;
  nom_contact?: string | null;
  decisionnaire_nom?: string | null;
  decisionnaire_fonction?: string | null;
  decisionnaire_email_pro?: string | null;
}
