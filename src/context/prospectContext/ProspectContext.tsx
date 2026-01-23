import { createContext } from 'react';
import type { Prospect, Appel, Vente, CreateVenteData, Pagination } from '../../utils/types';

export interface ProspectContextType {
  // Prospect
  currentProspect: Prospect | null;
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

  // Prospect actions
  loadProspect: (id: number) => Promise<void>;
  loadProspectByPhone: (phone: string) => Promise<void>;
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

  // Computed properties
  fullName: string;
  typeFiche: 'client' | 'jamais_appele' | 'deja_appele' | 'recycle';
}

export const ProspectContext = createContext<ProspectContextType | undefined>(undefined);
