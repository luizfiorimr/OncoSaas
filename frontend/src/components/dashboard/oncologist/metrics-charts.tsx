'use client';

import { DashboardMetrics, DashboardStatistics } from '@/lib/api/dashboard';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface MetricsChartsProps {
  metrics: DashboardMetrics;
  statistics: DashboardStatistics;
  isLoading?: boolean;
  onPriorityFilter?: (category: string | null) => void;
}

const COLORS = {
  critical: '#ef4444', // red-500
  high: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  low: '#22c55e', // green-500
};

const JOURNEY_STAGE_LABELS: Record<string, string> = {
  SCREENING: 'Rastreio',
  NAVIGATION: 'Navegação',
  DIAGNOSIS: 'Diagnóstico',
  TREATMENT: 'Tratamento',
  FOLLOW_UP: 'Seguimento',
};

export function MetricsCharts({
  metrics,
  statistics,
  isLoading,
  onPriorityFilter,
}: MetricsChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-6 h-80 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-full bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Dados para gráfico de pizza de prioridade
  const priorityData = [
    {
      name: 'Crítico',
      value: metrics.priorityDistribution.critical,
      color: COLORS.critical,
    },
    {
      name: 'Alto',
      value: metrics.priorityDistribution.high,
      color: COLORS.high,
    },
    {
      name: 'Médio',
      value: metrics.priorityDistribution.medium,
      color: COLORS.medium,
    },
    {
      name: 'Baixo',
      value: metrics.priorityDistribution.low,
      color: COLORS.low,
    },
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras de tipo de câncer (top 5)
  const cancerTypeData = metrics.cancerTypeDistribution.slice(0, 5);

  // Dados para gráfico de barras de estágio da jornada
  const journeyStageData = metrics.journeyStageDistribution.map(item => ({
    stage: JOURNEY_STAGE_LABELS[item.stage] || item.stage,
    count: item.count,
    percentage: item.percentage,
  }));

  // Dados para gráfico de linha de alertas por severidade
  const alertStatisticsData = statistics.alertStatistics.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    Crítico: item.critical,
    Alto: item.high,
    Médio: item.medium,
    Baixo: item.low,
  }));

  const handlePieClick = (data: any) => {
    if (onPriorityFilter) {
      const categoryMap: Record<string, string> = {
        Crítico: 'CRITICAL',
        Alto: 'HIGH',
        Médio: 'MEDIUM',
        Baixo: 'LOW',
      };
      onPriorityFilter(categoryMap[data.name] || null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Distribuição por Prioridade */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Distribuição por Prioridade
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras - Distribuição por Tipo de Câncer */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Top 5 Tipos de Câncer
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cancerTypeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="cancerType"
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras - Distribuição por Estágio da Jornada */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Distribuição por Estágio da Jornada
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={journeyStageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="stage"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Linha - Alertas por Severidade (Últimos 7 dias) */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          Alertas por Severidade (Últimos {statistics.period === '7d' ? '7' : statistics.period === '30d' ? '30' : '90'} dias)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={alertStatisticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="Crítico"
              stroke={COLORS.critical}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Alto"
              stroke={COLORS.high}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Médio"
              stroke={COLORS.medium}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Baixo"
              stroke={COLORS.low}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

