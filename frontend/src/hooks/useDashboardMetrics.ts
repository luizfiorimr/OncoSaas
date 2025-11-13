import { useQuery } from '@tanstack/react-query';
import { dashboardApi, DashboardMetrics, DashboardStatistics } from '@/lib/api/dashboard';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardApi.getMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
  });
};

export const useDashboardStatistics = (period: '7d' | '30d' | '90d' = '7d') => {
  return useQuery({
    queryKey: ['dashboard', 'statistics', period],
    queryFn: () => dashboardApi.getStatistics(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

