import axios, { AxiosInstance } from 'axios';

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

  // Grading
  async gradeImage(
    file: File,
    confidenceThreshold = 0.75,
    saveAnnotated = true,
  ) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/grade', formData, {
      params: {
        confidence_threshold: confidenceThreshold,
        save_annotated: saveAnnotated,
      },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getPredictions(skip = 0, limit = 20) {
    const response = await this.client.get('/records', {
      params: { skip, limit },
    });
    return response.data;
  }

  async recordBatch(
    id: number,
    counts: { good: number; stained: number; damaged: number },
  ) {
    const response = await this.client.post(`/predictions/${id}/record`, {
      okay_count: counts.good,
      stained_count: counts.stained,
      damaged_count: counts.damaged,
    });
    return response.data;
  }

  async getPrediction(id: number) {
    const response = await this.client.get(`/predictions/${id}`);
    return response.data;
  }

  async deletePrediction(id: number) {
    const response = await this.client.delete(`/predictions/${id}`);
    return response.data;
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.client.get('/stats');
    return response.data;
  }

  async getHealth() {
    const response = await this.client.get('/dashboard/health');
    return response.data;
  }

  async getGradeDistribution() {
    const response = await this.client.get('/dashboard/grades');
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await this.client.get('/settings');
    return response.data;
  }

  async updateSettings(settings: { mm_per_pixel: number }) {
    const response = await this.client.put('/settings', settings);
    return response.data;
  }
}

export const apiClient = new ApiClient();
