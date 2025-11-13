import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OncologyNavigationService } from './oncology-navigation.service';
import { CreateNavigationStepDto } from './dto/create-navigation-step.dto';
import { UpdateNavigationStepDto } from './dto/update-navigation-step.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JourneyStage } from '@prisma/client';

@Controller('oncology-navigation')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OncologyNavigationController {
  constructor(
    private readonly navigationService: OncologyNavigationService
  ) {}

  @Get('patients/:patientId/steps')
  async getPatientSteps(
    @Param('patientId') patientId: string,
    @Request() req: any
  ) {
    return this.navigationService.getPatientNavigationSteps(
      patientId,
      req.user.tenantId
    );
  }

  @Get('patients/:patientId/steps/:journeyStage')
  async getStepsByStage(
    @Param('patientId') patientId: string,
    @Param('journeyStage') journeyStage: JourneyStage,
    @Request() req: any
  ) {
    return this.navigationService.getStepsByJourneyStage(
      patientId,
      req.user.tenantId,
      journeyStage
    );
  }

  @Post('patients/:patientId/initialize')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ONCOLOGIST)
  async initializeSteps(
    @Param('patientId') patientId: string,
    @Body() body: { cancerType: string; currentStage: JourneyStage },
    @Request() req: any
  ) {
    await this.navigationService.initializeNavigationSteps(
      patientId,
      req.user.tenantId,
      body.cancerType,
      body.currentStage
    );
    return { message: 'Navigation steps initialized successfully' };
  }

  @Post('steps')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ONCOLOGIST)
  async createStep(
    @Body() createDto: CreateNavigationStepDto,
    @Request() req: any
  ) {
    return this.navigationService.createStep(createDto, req.user.tenantId);
  }

  @Patch('steps/:id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ONCOLOGIST)
  async updateStep(
    @Param('id') id: string,
    @Body() updateDto: UpdateNavigationStepDto,
    @Request() req: any
  ) {
    return this.navigationService.updateStep(
      id,
      updateDto,
      req.user.tenantId
    );
  }

  @Post('initialize-all-patients')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async initializeAllPatients(@Request() req: any) {
    const result = await this.navigationService.initializeAllPatientsSteps(
      req.user.tenantId
    );
    return {
      message: 'Etapas de navegação inicializadas para pacientes existentes',
      ...result,
    };
  }

  @Post('check-overdue')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async checkOverdue(@Request() req: any) {
    const result = await this.navigationService.checkOverdueSteps(req.user.tenantId);
    return {
      message: 'Overdue steps checked and alerts created',
      ...result,
    };
  }
}

