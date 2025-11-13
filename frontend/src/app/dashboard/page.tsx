'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { PatientListConnected } from '@/components/dashboard/patient-list-connected';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { ConversationView } from '@/components/dashboard/conversation-view';
import { PatientDetails } from '@/components/dashboard/patient-details';
import { AlertDetails } from '@/components/dashboard/alert-details';
import { ResizablePanel } from '@/components/dashboard/resizable-panel';
import { usePatient } from '@/hooks/usePatients';
import {
  useMessages,
  useUnassumedMessagesCount,
  useSendMessage,
  useAssumeMessage,
} from '@/hooks/useMessages';
import { useMessagesSocket } from '@/hooks/useMessagesSocket';
import { useAlert } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { LogOut, Bell, Navigation } from 'lucide-react';
import { Alert } from '@/lib/api/alerts';
import { KPICards } from '@/components/dashboard/oncologist/kpi-cards';
import { MetricsCharts } from '@/components/dashboard/oncologist/metrics-charts';
import { CriticalAlertsPanel } from '@/components/dashboard/oncologist/critical-alerts-panel';
import { TeamPerformance } from '@/components/dashboard/oncologist/team-performance';
import { PatientListEnhanced } from '@/components/dashboard/oncologist/patient-list-enhanced';
import { useDashboardMetrics, useDashboardStatistics } from '@/hooks/useDashboardMetrics';
import { usePatients } from '@/hooks/usePatients';
import { useDashboardSocket } from '@/hooks/useDashboardSocket';
import { Calendar, RefreshCw } from 'lucide-react';

// Componente do Dashboard de Enfermagem
function NursingDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isNursingActive, setIsNursingActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'alerts'>('patients');
  const { data: unassumedCount } = useUnassumedMessagesCount();

  // Verificar autenticação e obter paciente da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const patientId = params.get('patient');
      if (patientId) {
        setSelectedPatient(patientId);
      }
    }
  }, []);

  const { data: selectedPatientData, isLoading: isLoadingPatient } = usePatient(
    selectedPatient || '',
    { enabled: !!selectedPatient }
  );
  const { data: messages } = useMessages(selectedPatient || undefined);
  const { data: alertDetails, isLoading: isLoadingAlert } = useAlert(
    selectedAlert?.id || ''
  );

  const displayAlert = alertDetails || selectedAlert;
  useMessagesSocket(selectedPatient || undefined);

  const sendMessageMutation = useSendMessage();
  const assumeMessageMutation = useAssumeMessage();

  const conversationId =
    messages && messages.length > 0 ? messages[0].conversationId : undefined;

  const handleSendMessage = async (content: string) => {
    if (!selectedPatient) return;

    try {
      await sendMessageMutation.mutateAsync({
        patientId: selectedPatient,
        content,
        conversationId: conversationId || undefined,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleTakeOver = async () => {
    if (!selectedPatient || !messages || messages.length === 0) return;

    const unassumedMessage = messages
      .filter((msg) => !msg.assumedBy && msg.direction === 'INBOUND')
      .sort(
        (a, b) =>
          new Date(b.whatsappTimestamp).getTime() -
          new Date(a.whatsappTimestamp).getTime()
      )[0];

    if (unassumedMessage) {
      try {
        await assumeMessageMutation.mutateAsync(unassumedMessage.id);
        setIsNursingActive(true);
      } catch (error) {
        console.error('Erro ao assumir conversa:', error);
      }
    } else {
      setIsNursingActive(true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      <header className="bg-white border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">MEDSAAS Dashboard</h1>
              <p className="text-sm text-gray-600">
                {user?.tenant?.name || 'Hospital Teste'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/oncology-navigation')}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Navegação Oncológica
              </Button>
              {unassumedCount && unassumedCount.count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <Bell className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">
                    {unassumedCount.count} mensagens não assumidas
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                {user?.name} ({user?.role})
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          <ResizablePanel
            defaultWidth={320}
            minWidth={250}
            maxWidth={500}
            storageKey="dashboard-left-panel-width"
            side="left"
          >
            <div className="h-full flex flex-col bg-white border-r">
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('patients')}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                      activeTab === 'patients'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pacientes
                  </button>
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                      activeTab === 'alerts'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Alertas
                  </button>
                </div>

                {activeTab === 'patients' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {activeTab === 'patients' ? (
                  <PatientListConnected onPatientSelect={setSelectedPatient} />
                ) : (
                  <AlertsPanel
                    onAlertSelect={setSelectedAlert}
                    selectedAlertId={selectedAlert?.id}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>

          <div className="flex-1 min-w-0 h-full">
            {selectedPatient ? (
              isLoadingPatient ? (
                <div className="bg-white h-full flex items-center justify-center text-gray-500">
                  <p>Carregando dados do paciente...</p>
                </div>
              ) : selectedPatientData ? (
                <div className="bg-white h-full border-x">
                  <ConversationView
                    patientName={selectedPatientData.name}
                    patientInfo={{
                      cancerType:
                        selectedPatientData.cancerDiagnoses &&
                        selectedPatientData.cancerDiagnoses.length > 0
                          ? selectedPatientData.cancerDiagnoses
                              .map((d) => d.cancerType)
                              .join(', ')
                          : selectedPatientData.cancerType || 'Em Rastreio',
                      stage:
                        selectedPatientData.cancerDiagnoses &&
                        selectedPatientData.cancerDiagnoses.length > 0
                          ? selectedPatientData.cancerDiagnoses[0].stage ||
                            'N/A'
                          : selectedPatientData.stage || 'N/A',
                      age: selectedPatientData.birthDate
                        ? new Date().getFullYear() -
                          new Date(selectedPatientData.birthDate).getFullYear()
                        : 0,
                      priorityScore: selectedPatientData.priorityScore || 0,
                      priorityCategory: (
                        selectedPatientData.priorityCategory || 'MEDIUM'
                      ).toLowerCase() as 'critico' | 'alto' | 'medio' | 'baixo',
                    }}
                    messages={(messages || []).map((msg) => ({
                      id: msg.id,
                      sender: msg.direction === 'INBOUND' ? 'patient' : 'agent',
                      content: msg.content || '',
                      timestamp: new Date(
                        msg.whatsappTimestamp || msg.createdAt
                      ),
                    }))}
                    structuredData={{
                      symptoms: {},
                    }}
                    onSendMessage={handleSendMessage}
                    onTakeOver={handleTakeOver}
                    isNursingActive={isNursingActive}
                    isSending={sendMessageMutation.isPending}
                  />
                </div>
              ) : (
                <div className="bg-white h-full flex flex-col items-center justify-center text-gray-500">
                  <p className="text-lg mb-2">Erro ao carregar paciente</p>
                  <p className="text-sm">
                    Não foi possível carregar os dados do paciente selecionado
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg mb-2">Selecione um paciente</p>
                <p className="text-sm">
                  Escolha um paciente da lista para ver a conversa
                </p>
              </div>
            )}
          </div>

          <ResizablePanel
            defaultWidth={360}
            minWidth={280}
            maxWidth={600}
            storageKey="dashboard-right-panel-width"
            side="right"
          >
            <div className="h-full overflow-y-auto flex flex-col">
              <div className="border-b">
                <PatientDetails
                  patient={selectedPatientData || null}
                  isLoading={isLoadingPatient}
                />
              </div>

              <div className="flex-1">
                <AlertDetails
                  alert={displayAlert}
                  isLoading={isLoadingAlert && !!selectedAlert}
                  onClose={() => setSelectedAlert(null)}
                />
              </div>
            </div>
          </ResizablePanel>
        </div>
      </div>
    </div>
  );
}

// Componente do Dashboard Gerencial (Oncologistas)
function ManagementDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [statisticsPeriod, setStatisticsPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: statistics, isLoading: isLoadingStatistics } = useDashboardStatistics(statisticsPeriod);
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  
  useDashboardSocket();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePatientClick = (patientId: string) => {
    router.push(`/dashboard?patient=${patientId}`);
  };

  const handleAlertSelect = (alert: Alert) => {
    if (alert.patientId) {
      handlePatientClick(alert.patientId);
    }
  };

  const handlePriorityFilter = (_category: string | null) => {
    // Filtro de prioridade pode ser implementado aqui se necessário
    // Por enquanto, apenas aceita a prop do MetricsCharts
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100">
      <header className="sticky top-0 z-40 w-full border-b bg-white p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Gerencial
            </h1>
            <span className="text-sm text-gray-500">
              {user?.tenant?.name || user?.tenantId || 'Tenant'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <select
                value={statisticsPeriod}
                onChange={(e) =>
                  setStatisticsPeriod(e.target.value as '7d' | '30d' | '90d')
                }
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchMetrics()}
              disabled={isLoadingMetrics}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-6">
          {metrics && metrics.criticalAlertsCount > 0 && (
            <CriticalAlertsPanel onAlertSelect={handleAlertSelect} />
          )}

          {metrics && (
            <KPICards metrics={metrics} isLoading={isLoadingMetrics} />
          )}

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

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pacientes</h2>
            </div>
            {isLoadingPatients ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border bg-gray-50 animate-pulse h-32"
                  ></div>
                ))}
              </div>
            ) : (
              <PatientListEnhanced
                patients={patients || []}
                onPatientClick={handlePatientClick}
                isLoading={isLoadingPatients}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();

  // Inicializar autenticação do localStorage
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

  if (!isAuthenticated || !user) {
    return null;
  }

  // Detectar role e renderizar dashboard apropriado
  const isManagementRole = 
    user.role === 'ONCOLOGIST' || 
    user.role === 'ADMIN' || 
    user.role === 'COORDINATOR';

  if (isManagementRole) {
    return <ManagementDashboard />;
  }

  // Dashboard de enfermagem para NURSE
  return <NursingDashboard />;
}
