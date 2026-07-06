import { createContext } from 'react';
import type { Prospect, Appel, Vente, LeadClient, CreateVenteData, Pagination, UpdateProspectData } from '../../utils/types';

export interface ProspectContextType {
  // Prospect
  currentProspect: Prospect | null;
  currentProgpa: number | null;
  isLoading: boolean;
  error: string | null;

  // Appels
  appels: Appel[];
  appelsLoading: boolean;
  appelsError: string | null;
  appelsPagination: Pagination;

  // Ventes
  ventes: Vente[];
  ventesLoading: boolean;
  ventesError: string | null;

  // Rendez-vous
  rendezVous: LeadClient[];
  rendezVousLoading: boolean;
  rendezVousError: string | null;

  // Prospect actions
  loadProspect: (id: number) => Promise<void>;
  loadProspectByPhone: (phone: string) => Promise<void>;
  updateProspect: (data: UpdateProspectData) => Promise<void>;
  setCurrentProgpa: (value: number | null) => void;
  resetCurrentProgpa: () => void;
  clearProspect: () => void;
  clearError: () => void;

  // Appels actions
  loadAppels: (page?: number) => Promise<void>;
  updateAppelNotes: (appelId: number, notes: string) => Promise<void>;
  clearAppelsError: () => void;

  // Ventes actions
  loadVentes: () => Promise<void>;
  createVente: (data: CreateVenteData) => Promise<Vente>;
  clearVentesError: () => void;

  // Rendez-vous actions
  loadRendezVous: () => Promise<void>;
  clearRendezVousError: () => void;

  // Computed properties
  fullName: string;
  typeFiche: 'client' | 'jamais_appele' | 'deja_appele' | 'recycle';
}

export const ProspectContext = createContext<ProspectContextType | undefined>(undefined);
