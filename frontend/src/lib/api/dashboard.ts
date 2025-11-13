import { apiClient } from './client';

export interface DashboardMetrics {
  totalActivePatients: number;
  criticalPatientsCount: number;
  totalPendingAlerts: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  lowAlertsCount: number;
  unassumedMessagesCount: number;
  resolvedTodayCount: number;
  averageResponseTimeMinutes: number | null;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  cancerTypeDistribution: Array<{
    cancerType: string;
    count: number;
    percentage: number;
  }>;
  journeyStageDistribution: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface AlertStatisticsPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface PatientStatisticsPoint {
  date: string;
  active: number;
  critical: number;
  new: number;
}

export interface ResponseTimeStatisticsPoint {
  date: string;
  averageMinutes: number;
}

export interface DashboardStatistics {
  period: '7d' | '30d' | '90d';
  alertStatistics: AlertStatisticsPoint[];
  patientStatistics: PatientStatisticsPoint[];
  responseTimeStatistics: ResponseTimeStatisticsPoint[];
}

export const dashboardApi = {
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  },

  async getStatistics(period: '7d' | '30d' | '90d' = '7d'): Promise<DashboardStatistics> {
    return apiClient.get<DashboardStatistics>(`/dashboard/statistics?period=${period}`);
  },
};

