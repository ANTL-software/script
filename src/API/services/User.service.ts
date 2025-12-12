import apiCalls from '../APICalls';
import { apiClient } from '../config';
import { UserModel } from '../models/User.model';
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

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Échec de la connexion');
    }

    const { token, refreshToken, employe } = response.data;

    apiClient.setTokens(token, refreshToken);

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
      apiClient.clearTokens();
      UserModel.clearFromLocalStorage();
    }
  }

  public async getCurrentUser(): Promise<UserModel> {
    const response = await apiCalls.get<Employe>(this.AUTH_ENDPOINTS.ME);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Impossible de récupérer les données utilisateur');
    }

    const userModel = UserModel.fromJSON(response.data);
    userModel.saveToLocalStorage();

    return userModel;
  }

  public async refreshToken(): Promise<string> {
    const refreshToken = apiClient.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiCalls.post<{ token: string }>(
      this.AUTH_ENDPOINTS.REFRESH,
      { refreshToken }
    );

    if (!response.success || !response.data?.token) {
      throw new Error('Failed to refresh token');
    }

    const newAccessToken = response.data.token;
    apiClient.setAccessToken(newAccessToken);

    return newAccessToken;
  }

  public getStoredUser(): UserModel | null {
    return UserModel.fromLocalStorage();
  }

  public hasValidToken(): boolean {
    return apiClient.hasValidToken();
  }

  public clearSession(): void {
    apiClient.clearTokens();
    UserModel.clearFromLocalStorage();
  }
}

export const userService = UserService.getInstance();
export default userService;
