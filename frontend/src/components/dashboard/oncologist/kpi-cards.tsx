'use client';

import { DashboardMetrics } from '@/lib/api/dashboard';
import { AlertTriangle, Users, Bell, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  metrics: DashboardMetrics | undefined;
  isLoading?: boolean;
}

export function KPICards({ metrics, isLoading }: KPICardsProps) {
  if (!metrics) {
    return null;
  }
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Pacientes Críticos',
      value: metrics.criticalPatientsCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badge: metrics.criticalPatientsCount > 0,
    },
    {
      title: 'Total de Pacientes',
      value: metrics.totalActivePatients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Alertas Pendentes',
      value: metrics.totalPendingAlerts,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      badge: metrics.criticalAlertsCount > 0,
      breakdown: {
        critical: metrics.criticalAlertsCount,
        high: metrics.highAlertsCount,
        medium: metrics.mediumAlertsCount,
        low: metrics.lowAlertsCount,
      },
    },
    {
      title: 'Tempo Médio de Resposta',
      value: metrics.averageResponseTimeMinutes
        ? `${Math.round(metrics.averageResponseTimeMinutes / 60)}h ${metrics.averageResponseTimeMinutes % 60}m`
        : 'N/A',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Mensagens Não Assumidas',
      value: metrics.unassumedMessagesCount,
      icon: MessageSquare,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badge: metrics.unassumedMessagesCount > 0,
    },
    {
      title: 'Casos Resolvidos Hoje',
      value: metrics.resolvedTodayCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={cn(
              'bg-white rounded-lg border p-4 relative',
              card.borderColor
            )}
          >
            {card.badge && (
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
            <div className="flex items-start justify-between mb-2">
              <div className={cn('p-2 rounded-md', card.bgColor)}>
                <Icon className={cn('h-5 w-5', card.color)} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.breakdown && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Crítico:</span>
                    <span className="font-semibold text-red-600">
                      {card.breakdown.critical}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alto:</span>
                    <span className="font-semibold text-orange-600">
                      {card.breakdown.high}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Médio:</span>
                    <span className="font-semibold text-yellow-600">
                      {card.breakdown.medium}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Baixo:</span>
                    <span className="font-semibold text-gray-600">
                      {card.breakdown.low}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

