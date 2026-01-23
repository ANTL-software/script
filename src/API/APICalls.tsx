import { AxiosError } from 'axios';

import type { AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '../utils/types';

import api from './config';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

class ApiCalls {
  private maxRetries = 3;
  private retryDelay = 1000;

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      return (
        !error.response &&
        (error.code === 'ECONNABORTED' ||
          error.code === 'ERR_NETWORK' ||
          error.message.includes('Network Error'))
      );
    }
    return false;
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Une erreur est survenue',
        status: error.response?.status,
        errors: error.response?.data?.errors,
      };
      throw apiError;
    }

    throw {
      message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue',
    } as ApiError;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (this.isNetworkError(error) && attempt < this.maxRetries) {
        console.warn(`[API] Tentative ${attempt}/${this.maxRetries} échouée, nouvelle tentative...`);
        await this.sleep(this.retryDelay * attempt);
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  public async get<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      return await this.retryRequest(async () => {
        const response: AxiosResponse<ApiResponse<T>> = await api.get(endpoint, config);
        return response.data;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      return await this.retryRequest(async () => {
        const response: AxiosResponse<ApiResponse<T>> = await api.post(endpoint, data, config);
        return response.data;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      return await this.retryRequest(async () => {
        const response: AxiosResponse<ApiResponse<T>> = await api.put(endpoint, data, config);
        return response.data;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      return await this.retryRequest(async () => {
        const response: AxiosResponse<ApiResponse<T>> = await api.patch(endpoint, data, config);
        return response.data;
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async delete<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      return await this.retryRequest(async () => {
        const response: AxiosResponse<ApiResponse<T>> = await api.delete(endpoint, config);
        return response.data;
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const apiCalls = new ApiCalls();
export default apiCalls;
