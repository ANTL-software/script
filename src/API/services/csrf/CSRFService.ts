import axios from 'axios';

import { getApiBaseUrl } from '../../../utils/scripts/index';

interface CSRFTokenResponse {
  success: boolean;
  csrfToken: string;
  headerName: string;
}

class CSRFService {
  private token: string | null = null;
  private headerName = 'x-csrf-token';
  private pendingToken: Promise<string> | null = null;

  private async fetchToken(): Promise<string> {
    const response = await axios.get<CSRFTokenResponse>(
      `${getApiBaseUrl()}/csrf-token`,
      { withCredentials: true }
    );

    if (!response.data.success || !response.data.csrfToken) {
      throw new Error('Token CSRF non reçu');
    }

    this.token = response.data.csrfToken;
    this.headerName = response.data.headerName || 'x-csrf-token';
    return this.token;
  }

  public async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    if (!this.pendingToken) {
      this.pendingToken = this.fetchToken().finally(() => {
        this.pendingToken = null;
      });
    }

    return this.pendingToken;
  }

  public async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return { [this.headerName]: token };
  }

  public getCachedHeaders(): Record<string, string> {
    return this.token ? { [this.headerName]: this.token } : {};
  }

  public clearToken(): void {
    this.token = null;
  }
}

export const csrfService = new CSRFService();
