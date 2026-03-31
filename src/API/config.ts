import axios, { AxiosError } from "axios";

import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

export interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;
  private refreshTokenPromise: Promise<void> | null = null;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8800/api",
      timeout: 30000,
      withCredentials: true, // Envoie les cookies httpOnly automatiquement
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Pas d'injection de Bearer token — le cookie httpOnly est envoyé automatiquement

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        const authEndpoints = ['/auth/login', '/auth/refresh', '/auth/logout'];
        const isAuthEndpoint = authEndpoints.some(endpoint =>
          originalRequest?.url?.includes(endpoint)
        );

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            await this.handleTokenRefresh();
            // Le cookie rafraîchi est posé par le serveur — on rejoue la requête
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.clearSession();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async handleTokenRefresh(): Promise<void> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        // Le refresh token httpOnly est envoyé automatiquement via withCredentials
        await axios.post(
          `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Vérifie si une session est active via le cookie lisible `session_active`
   * (le token JWT lui-même est httpOnly et inaccessible au JS)
   */
  public hasValidToken(): boolean {
    return document.cookie.split(';').some(c => c.trim().startsWith('session_active='));
  }

  /** Supprime les données de session côté client (les cookies httpOnly sont effacés par le serveur) */
  public clearSession(): void {
    localStorage.removeItem("employe");
  }
}

export const apiClient = ApiClient.getInstance();
export default apiClient.getAxiosInstance();
