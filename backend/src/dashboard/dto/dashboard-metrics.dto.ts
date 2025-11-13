export class DashboardMetricsDto {
  // KPIs principais
  totalActivePatients: number;
  criticalPatientsCount: number; // Score >= 75
  totalPendingAlerts: number;
  criticalAlertsCount: number;
  highAlertsCount: number;
  mediumAlertsCount: number;
  lowAlertsCount: number;
  unassumedMessagesCount: number;
  resolvedTodayCount: number;
  averageResponseTimeMinutes: number | null;

  // Distribuições
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

