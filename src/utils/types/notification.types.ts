export type NotificationType = 'rdv_30min' | 'rdv_10min' | 'rdv_manque' | 'info';

export interface Notification {
  id_notification: number;
  id_agent: number;
  id_rendez_vous: number | null;
  type: NotificationType | null;
  message: string | null;
  lu: boolean;
  created_at: string;
  rendezVous?: {
    id_rendez_vous: number;
    date_rdv: string;
    heure_rdv: string;
    motif: string | null;
    prospect?: {
      id_prospect: number;
      nom: string;
      prenom: string | null;
      telephone: string;
      raison_sociale: string | null;
    };
  };
}
