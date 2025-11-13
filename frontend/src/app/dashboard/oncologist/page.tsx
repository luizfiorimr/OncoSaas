'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { KPICards } from '@/components/dashboard/oncologist/kpi-cards';
import { MetricsCharts } from '@/components/dashboard/oncologist/metrics-charts';
import { CriticalAlertsPanel } from '@/components/dashboard/oncologist/critical-alerts-panel';
import { TeamPerformance } from '@/components/dashboard/oncologist/team-performance';
import { PatientListEnhanced } from '@/components/dashboard/oncologist/patient-list-enhanced';
import { useDashboardMetrics, useDashboardStatistics } from '@/hooks/useDashboardMetrics';
import { usePatients } from '@/hooks/usePatients';
import { useDashboardSocket } from '@/hooks/useDashboardSocket';
import { Button } from '@/components/ui/button';
import { LogOut, Calendar, RefreshCw } from 'lucide-react';
import { Alert } from '@/lib/api/alerts';

export default function OncologistDashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, initialize } = useAuthStore();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statisticsPeriod, setStatisticsPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Dados do dashboard
  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: statistics, isLoading: isLoadingStatistics } = useDashboardStatistics(statisticsPeriod);
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  
  // WebSocket para atualizações em tempo real
  useDashboardSocket();

  // Inicializar autenticação
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
    }, 100);

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePatientClick = (patientId: string) => {
    setSelectedPatient(patientId);
    // Redirecionar para o dashboard de enfermagem com o paciente selecionado
    router.push(`/dashboard?patient=${patientId}`);
  };

  const handleAlertSelect = (alert: Alert) => {
    setSelectedAlert(alert);
    if (alert.patientId) {
      handlePatientClick(alert.patientId);
    }
  };

  const handlePriorityFilter = (category: string | null) => {
    setPriorityFilter(category);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Gerencial
              </h1>
              <span className="text-sm text-gray-500">
                {user.tenant?.name || user.tenantId || 'Tenant'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={statisticsPeriod}
                  onChange={(e) =>
                    setStatisticsPeriod(
                      e.target.value as '7d' | '30d' | '90d'
                    )
                  }
                  className="text-sm border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchMetrics();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{user.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {user.role}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Alertas Críticos (se houver) */}
        {metrics && metrics.criticalAlertsCount > 0 && (
          <CriticalAlertsPanel onAlertSelect={handleAlertSelect} />
        )}

        {/* KPI Cards */}
        {metrics && (
          <KPICards metrics={metrics} isLoading={isLoadingMetrics} />
        )}

        {/* Gráficos de Métricas */}
        {metrics && statistics ? (
          <MetricsCharts
            metrics={metrics}
            statistics={statistics}
            isLoading={isLoadingMetrics || isLoadingStatistics}
            onPriorityFilter={handlePriorityFilter}
          />
        ) : (
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
        )}

        {/* Performance da Equipe */}
        {metrics && statistics ? (
          <TeamPerformance
            metrics={metrics}
            statistics={statistics}
            isLoading={isLoadingMetrics || isLoadingStatistics}
          />
        ) : (
          <div className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Pacientes */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pacientes</h2>
            {priorityFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Filtrado por: {priorityFilter}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPriorityFilter(null)}
                >
                  Limpar filtro
                </Button>
              </div>
            )}
          </div>
          {patients && (
            <PatientListEnhanced
              patients={patients}
              onPatientClick={handlePatientClick}
              isLoading={isLoadingPatients}
            />
          )}
        </div>
      </main>
    </div>
  );
}

