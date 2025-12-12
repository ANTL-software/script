import { AxiosError } from 'axios';

import type { AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '../utils/types/api.types';

import api from './config';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

class ApiCalls {
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

  public async get<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.get(endpoint, config);
      return response.data;
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
      const response: AxiosResponse<ApiResponse<T>> = await api.post(endpoint, data, config);
      return response.data;
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
      const response: AxiosResponse<ApiResponse<T>> = await api.put(endpoint, data, config);
      return response.data;
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
      const response: AxiosResponse<ApiResponse<T>> = await api.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async delete<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await api.delete(endpoint, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const apiCalls = new ApiCalls();
export default apiCalls;
