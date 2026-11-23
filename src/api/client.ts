import axios, { AxiosInstance } from 'axios';
import {
  DashboardStats,
  DecisionDistribution,
  GradeDistribution,
  HealthStatus,
  InspectionFilters,
  Prediction,
  PredictionDetail,
} from '../types';

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/+$/,
  '',
);
const API_BASE_URL = `${configuredApiUrl ?? ''}/api/v1`;
export const API_ORIGIN = configuredApiUrl ?? '';

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** Inspect one still image. Every detected egg is graded individually. */
  async inspectImage(
    file: File,
    confidenceThreshold = 0.75,
    saveAnnotated = true,
  ): Promise<PredictionDetail> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/predictions/upload', formData, {
      params: {
        confidence_threshold: confidenceThreshold,
        save_annotated: saveAnnotated,
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getInspections(
    skip = 0,
    limit = 20,
    filters: InspectionFilters = {},
  ): Promise<Prediction[]> {
    const response = await this.client.get('/predictions', {
      params: { skip, limit, ...filters },
    });
    return response.data;
  }

  async getInspection(id: number): Promise<PredictionDetail> {
    const response = await this.client.get(`/predictions/${id}`);
    return response.data;
  }

  async deleteInspection(id: number) {
    const response = await this.client.delete(`/predictions/${id}`);
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get('/dashboard/stats');
    return response.data;
  }

  async getHealth(): Promise<HealthStatus> {
    const response = await this.client.get('/dashboard/health');
    return response.data;
  }

  async getGradeDistribution(): Promise<GradeDistribution> {
    const response = await this.client.get('/dashboard/grades');
    return response.data;
  }

  async getDecisionDistribution(): Promise<DecisionDistribution> {
    const response = await this.client.get('/dashboard/decisions');
    return response.data;
  }
}

export const apiClient = new ApiClient();
