import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { DashboardStatisticsDto, AlertStatisticsPoint } from './dto/dashboard-statistics.dto';
import { PriorityCategory, PatientStatus, JourneyStage, AlertSeverity, AlertStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(tenantId: string): Promise<DashboardMetricsDto> {
    // Total de pacientes ativos
    const totalActivePatients = await this.prisma.patient.count({
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
    });

    // Pacientes críticos (score >= 75)
    const criticalPatientsCount = await this.prisma.patient.count({
      where: {
        tenantId,
        priorityScore: { gte: 75 },
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
    });

    // Alertas pendentes por severidade
    const alertsBySeverity = await this.prisma.alert.groupBy({
      by: ['severity'],
      where: {
        tenantId,
        status: {
          not: 'RESOLVED',
        },
      },
      _count: true,
    });

    const criticalAlertsCount = alertsBySeverity.find(a => a.severity === 'CRITICAL')?._count || 0;
    const highAlertsCount = alertsBySeverity.find(a => a.severity === 'HIGH')?._count || 0;
    const mediumAlertsCount = alertsBySeverity.find(a => a.severity === 'MEDIUM')?._count || 0;
    const lowAlertsCount = alertsBySeverity.find(a => a.severity === 'LOW')?._count || 0;
    const totalPendingAlerts = criticalAlertsCount + highAlertsCount + mediumAlertsCount + lowAlertsCount;

    // Mensagens não assumidas
    const unassumedMessagesCount = await this.prisma.message.count({
      where: {
        tenantId,
        direction: 'INBOUND',
        assumedBy: null,
      },
    });

    // Alertas resolvidos hoje
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedTodayCount = await this.prisma.alert.count({
      where: {
        tenantId,
        status: 'RESOLVED',
        resolvedAt: {
          gte: todayStart,
        },
      },
    });

    // Tempo médio de resposta a alertas (em minutos)
    const resolvedAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: 'RESOLVED',
        resolvedAt: { not: null },
        createdAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let averageResponseTimeMinutes: number | null = null;
    if (resolvedAlerts.length > 0) {
      const totalMinutes = resolvedAlerts.reduce((sum, alert) => {
        if (alert.createdAt && alert.resolvedAt) {
          const diffMs = new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime();
          return sum + Math.round(diffMs / (1000 * 60)); // Converter para minutos
        }
        return sum;
      }, 0);
      averageResponseTimeMinutes = Math.round(totalMinutes / resolvedAlerts.length);
    }

    // Distribuição por prioridade
    const priorityDistribution = await this.prisma.patient.groupBy({
      by: ['priorityCategory'],
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
      _count: true,
    });

    const priorityDist = {
      critical: priorityDistribution.find(p => p.priorityCategory === 'CRITICAL')?._count || 0,
      high: priorityDistribution.find(p => p.priorityCategory === 'HIGH')?._count || 0,
      medium: priorityDistribution.find(p => p.priorityCategory === 'MEDIUM')?._count || 0,
      low: priorityDistribution.find(p => p.priorityCategory === 'LOW')?._count || 0,
    };

    // Distribuição por tipo de câncer
    const cancerTypeDistribution = await this.prisma.patient.groupBy({
      by: ['cancerType'],
      where: {
        tenantId,
        cancerType: { not: null },
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
      _count: true,
    });

    const cancerTypeDist = cancerTypeDistribution
      .map(item => ({
        cancerType: item.cancerType || 'Não informado',
        count: item._count,
        percentage: totalActivePatients > 0 
          ? Math.round((item._count / totalActivePatients) * 100 * 10) / 10 
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Distribuição por estágio da jornada
    const journeyStageDistribution = await this.prisma.patient.groupBy({
      by: ['currentStage'],
      where: {
        tenantId,
        status: {
          in: ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'],
        },
      },
      _count: true,
    });

    const journeyDist = journeyStageDistribution.map(item => ({
      stage: item.currentStage,
      count: item._count,
      percentage: totalActivePatients > 0 
        ? Math.round((item._count / totalActivePatients) * 100 * 10) / 10 
        : 0,
    }));

    // Distribuição por status
    const statusDistribution = await this.prisma.patient.groupBy({
      by: ['status'],
      where: {
        tenantId,
      },
      _count: true,
    });

    const statusDist = statusDistribution.map(item => ({
      status: item.status,
      count: item._count,
      percentage: totalActivePatients > 0 
        ? Math.round((item._count / totalActivePatients) * 100 * 10) / 10 
        : 0,
    }));

    return {
      totalActivePatients,
      criticalPatientsCount,
      totalPendingAlerts,
      criticalAlertsCount,
      highAlertsCount,
      mediumAlertsCount,
      lowAlertsCount,
      unassumedMessagesCount,
      resolvedTodayCount,
      averageResponseTimeMinutes,
      priorityDistribution: priorityDist,
      cancerTypeDistribution: cancerTypeDist,
      journeyStageDistribution: journeyDist,
      statusDistribution: statusDist,
    };
  }

  async getStatistics(
    tenantId: string,
    period: '7d' | '30d' | '90d' = '7d'
  ): Promise<DashboardStatisticsDto> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Estatísticas de alertas por dia
    const alerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        severity: true,
      },
    });

    // Agrupar por data e severidade
    const alertsByDate = new Map<string, { critical: number; high: number; medium: number; low: number }>();
    
    alerts.forEach(alert => {
      const dateKey = new Date(alert.createdAt).toISOString().split('T')[0];
      if (!alertsByDate.has(dateKey)) {
        alertsByDate.set(dateKey, { critical: 0, high: 0, medium: 0, low: 0 });
      }
      const dayData = alertsByDate.get(dateKey)!;
      if (alert.severity === 'CRITICAL') dayData.critical++;
      else if (alert.severity === 'HIGH') dayData.high++;
      else if (alert.severity === 'MEDIUM') dayData.medium++;
      else if (alert.severity === 'LOW') dayData.low++;
    });

    // Preencher dias sem dados com zeros
    const alertStatistics: AlertStatisticsPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = alertsByDate.get(dateKey) || { critical: 0, high: 0, medium: 0, low: 0 };
      alertStatistics.push({
        date: dateKey,
        ...dayData,
        total: dayData.critical + dayData.high + dayData.medium + dayData.low,
      });
    }

    // Estatísticas de pacientes por dia
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        priorityScore: true,
        status: true,
      },
    });

    const patientsByDate = new Map<string, { active: number; critical: number; new: number }>();
    
    // Para cada dia, contar pacientes ativos e críticos naquele momento
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(23, 59, 59, 999);
      const dateKey = date.toISOString().split('T')[0];

      const activeOnDate = patients.filter(p => 
        new Date(p.createdAt) <= date && 
        ['ACTIVE', 'IN_TREATMENT', 'FOLLOW_UP'].includes(p.status)
      );
      
      const criticalOnDate = activeOnDate.filter(p => (p.priorityScore || 0) >= 75);
      const newOnDate = patients.filter(p => {
        const pDate = new Date(p.createdAt).toISOString().split('T')[0];
        return pDate === dateKey;
      });

      patientsByDate.set(dateKey, {
        active: activeOnDate.length,
        critical: criticalOnDate.length,
        new: newOnDate.length,
      });
    }

    const patientStatistics = Array.from(patientsByDate.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Estatísticas de tempo de resposta
    const resolvedAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        status: 'RESOLVED',
        resolvedAt: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const responseTimeByDate = new Map<string, number[]>();
    
    resolvedAlerts.forEach(alert => {
      if (alert.createdAt && alert.resolvedAt) {
        const dateKey = new Date(alert.resolvedAt).toISOString().split('T')[0];
        const diffMs = new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime();
        const minutes = Math.round(diffMs / (1000 * 60));
        
        if (!responseTimeByDate.has(dateKey)) {
          responseTimeByDate.set(dateKey, []);
        }
        responseTimeByDate.get(dateKey)!.push(minutes);
      }
    });

    const responseTimeStatistics = Array.from(responseTimeByDate.entries()).map(([date, times]) => ({
      date,
      averageMinutes: Math.round(times.reduce((sum, t) => sum + t, 0) / times.length),
    }));

    // Preencher dias sem dados
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      if (!responseTimeStatistics.find(r => r.date === dateKey)) {
        responseTimeStatistics.push({
          date: dateKey,
          averageMinutes: 0,
        });
      }
    }

    responseTimeStatistics.sort((a, b) => a.date.localeCompare(b.date));

    return {
      period,
      alertStatistics,
      patientStatistics,
      responseTimeStatistics,
    };
  }
}

