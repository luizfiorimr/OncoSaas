import { apiClient } from './client';

export interface Treatment {
  id: string;
  tenantId: string;
  diagnosisId: string;
  treatmentType: string;
  treatmentName: string | null;
  protocol: string | null;
  line: number | null;
  intent: string | null;
  startDate: string | null;
  plannedEndDate: string | null;
  actualEndDate: string | null;
  cyclesPlanned: number | null;
  cyclesCompleted: number | null;
  status: string | null;
  response: string | null;
  responseDate: string | null;
  toxicities: unknown | null; // JSON
  doseModifications: unknown | null; // JSON
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentData {
  diagnosisId: string;
  treatmentType: string;
  treatmentName?: string;
  protocol?: string;
  line?: number;
  intent?: string;
  startDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  cyclesPlanned?: number;
  cyclesCompleted?: number;
  status?: string;
  response?: string;
  responseDate?: string;
  toxicities?: unknown;
  doseModifications?: unknown;
  notes?: string;
}

export interface UpdateTreatmentData extends Partial<CreateTreatmentData> {}

export const treatmentsApi = {
  /**
   * Lista todos os tratamentos de um diagnóstico
   */
  getTreatmentsByDiagnosis: async (
    diagnosisId: string
  ): Promise<Treatment[]> => {
    return apiClient.get<Treatment[]>(`/treatments/diagnosis/${diagnosisId}`);
  },

  /**
   * Obtém um tratamento específico por ID
   */
  getTreatmentById: async (id: string): Promise<Treatment> => {
    return apiClient.get<Treatment>(`/treatments/${id}`);
  },

  /**
   * Cria um novo tratamento
   */
  createTreatment: async (data: CreateTreatmentData): Promise<Treatment> => {
    return apiClient.post<Treatment>('/treatments', data);
  },

  /**
   * Atualiza um tratamento existente
   */
  updateTreatment: async (
    id: string,
    data: UpdateTreatmentData
  ): Promise<Treatment> => {
    return apiClient.put<Treatment>(`/treatments/${id}`, data);
  },

  /**
   * Deleta um tratamento
   */
  deleteTreatment: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/treatments/${id}`);
  },
};
