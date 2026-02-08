const CLOSING_STORAGE_KEY = 'antl_pending_closing';

/**
 * Interface pour les donnees de closing en attente
 */
export interface PendingClosing {
  prospectId: number;
  prospectName: string;
  campagneId: number;
  dureeAppel?: number;
  timestamp: number;
}

/**
 * Service de gestion du closing obligatoire
 * Gere la persistance de l'etat de closing dans le localStorage
 */
export class ClosingService {
  private static instance: ClosingService;

  private constructor() {}

  public static getInstance(): ClosingService {
    if (!ClosingService.instance) {
      ClosingService.instance = new ClosingService();
    }
    return ClosingService.instance;
  }

  /**
   * Sauvegarde un closing en attente
   */
  public savePending(data: Omit<PendingClosing, 'timestamp'>): void {
    const pendingClosing: PendingClosing = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CLOSING_STORAGE_KEY, JSON.stringify(pendingClosing));
  }

  /**
   * Recupere le closing en attente
   */
  public getPending(): PendingClosing | null {
    const stored = localStorage.getItem(CLOSING_STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      this.clearPending();
      return null;
    }
  }

  /**
   * Verifie s'il y a un closing en attente
   */
  public hasPending(): boolean {
    return this.getPending() !== null;
  }

  /**
   * Supprime le closing en attente
   */
  public clearPending(): void {
    localStorage.removeItem(CLOSING_STORAGE_KEY);
  }
}

export const closingService = ClosingService.getInstance();
