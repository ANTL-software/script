import apiCalls from '../APICalls';
import { throwIfApiError } from '../apiHelpers';
import { apiClient } from '../config';
import { UserModel } from '../models';
import type {
  LoginCredentials,
  Employe,
} from '../../utils/types';

export interface LoginResponseData {
  token: string;
  refreshToken: string;
  employe: Employe;
}

export class UserService {
  private static instance: UserService;
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  };

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  public async login(credentials: LoginCredentials): Promise<UserModel> {
    const response = await apiCalls.post<LoginResponseData>(
      this.AUTH_ENDPOINTS.LOGIN,
      credentials
    );

    const { employe } = throwIfApiError(response, 'Échec de la connexion');
    // Les tokens sont désormais dans les cookies httpOnly posés par le serveur.
    // On stocke uniquement les données de profil (non-sensibles) en localStorage.
    const userModel = UserModel.fromJSON(employe);
    userModel.saveToLocalStorage();

    return userModel;
  }

  public async logout(): Promise<void> {
    try {
      await apiCalls.post(this.AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Error during logout API call:', error);
    } finally {
      // Le serveur efface les cookies httpOnly — on nettoie le localStorage
      apiClient.clearSession();
      UserModel.clearFromLocalStorage();
    }
  }

  public async getCurrentUser(): Promise<UserModel> {
    const response = await apiCalls.get<Employe>(this.AUTH_ENDPOINTS.ME);
    const data = throwIfApiError(response, 'Impossible de récupérer les données utilisateur');

    const userModel = UserModel.fromJSON(data);
    userModel.saveToLocalStorage();

    return userModel;
  }

  public async refreshToken(): Promise<void> {
    // Le refresh token httpOnly est envoyé automatiquement par le navigateur
    await apiCalls.post(this.AUTH_ENDPOINTS.REFRESH, {});
  }

  public getStoredUser(): UserModel | null {
    return UserModel.fromLocalStorage();
  }

  public hasValidToken(): boolean {
    return apiClient.hasValidToken();
  }

  public clearSession(): void {
    apiClient.clearSession();
    UserModel.clearFromLocalStorage();
  }
}

export const userService = UserService.getInstance();
export default userService;
