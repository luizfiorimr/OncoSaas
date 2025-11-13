import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(UserRole.ONCOLOGIST, UserRole.ADMIN, UserRole.COORDINATOR)
  async getMetrics(@CurrentUser() user: any): Promise<DashboardMetricsDto> {
    return this.dashboardService.getMetrics(user.tenantId);
  }

  @Get('statistics')
  @Roles(UserRole.ONCOLOGIST, UserRole.ADMIN, UserRole.COORDINATOR)
  async getStatistics(
    @CurrentUser() user: any,
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<DashboardStatisticsDto> {
    return this.dashboardService.getStatistics(
      user.tenantId,
      period || '7d'
    );
  }
}

