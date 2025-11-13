import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNavigationStepDto } from './dto/create-navigation-step.dto';
import { UpdateNavigationStepDto } from './dto/update-navigation-step.dto';
import { JourneyStage, NavigationStepStatus } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType, AlertSeverity } from '@prisma/client';

@Injectable()
export class OncologyNavigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService
  ) {}

  /**
   * Obtém todas as etapas de navegação de um paciente
   */
  async getPatientNavigationSteps(
    patientId: string,
    tenantId: string
  ): Promise<any[]> {
    const steps = await this.prisma.navigationStep.findMany({
      where: {
        patientId,
        tenantId,
      },
      orderBy: [
        { journeyStage: 'asc' },
        { expectedDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return steps;
  }

  /**
   * Obtém etapas por etapa da jornada
   */
  async getStepsByJourneyStage(
    patientId: string,
    tenantId: string,
    journeyStage: JourneyStage
  ): Promise<any[]> {
    return this.prisma.navigationStep.findMany({
      where: {
        patientId,
        tenantId,
        journeyStage,
      },
      orderBy: [
        { isRequired: 'desc' },
        { expectedDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Cria uma nova etapa de navegação
   */
  async createStep(
    createDto: CreateNavigationStepDto,
    tenantId: string
  ): Promise<any> {
    // Verificar se paciente existe
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: createDto.patientId,
        tenantId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Obter journey do paciente
    const journey = await this.prisma.patientJourney.findUnique({
      where: { patientId: createDto.patientId },
    });

    const step = await this.prisma.navigationStep.create({
      data: {
        ...createDto,
        tenantId,
        journeyId: journey?.id,
        status: NavigationStepStatus.PENDING,
        isCompleted: false,
      },
    });

    // Verificar se a etapa já está atrasada ao ser criada
    if (step.dueDate && step.dueDate < new Date() && !step.isCompleted) {
      await this.checkAndCreateAlertForStep(step, tenantId);
    }

    return step;
  }

  /**
   * Atualiza uma etapa de navegação
   */
  async updateStep(
    stepId: string,
    updateDto: UpdateNavigationStepDto,
    tenantId: string
  ): Promise<any> {
    const existingStep = await this.prisma.navigationStep.findFirst({
      where: {
        id: stepId,
        tenantId,
      },
    });

    if (!existingStep) {
      throw new NotFoundException('Navigation step not found');
    }

    const updateData: any = { ...updateDto };

    // Se marcando como completa, atualizar campos relacionados
    if (updateDto.isCompleted && !existingStep.isCompleted) {
      updateData.status = NavigationStepStatus.COMPLETED;
      updateData.completedAt = updateDto.completedAt || new Date();
      updateData.actualDate = updateDto.actualDate || new Date();
    }

    // Se mudando status para OVERDUE
    if (updateDto.status === NavigationStepStatus.OVERDUE) {
      updateData.status = NavigationStepStatus.OVERDUE;
    }

    const updatedStep = await this.prisma.navigationStep.update({
      where: { id: stepId },
      data: updateData,
    });

    // Se a etapa não foi marcada como completa e tem dueDate, verificar se está atrasada
    if (!updatedStep.isCompleted && updatedStep.dueDate && updatedStep.dueDate < new Date()) {
      // Atualizar status para OVERDUE se necessário
      if (updatedStep.status !== NavigationStepStatus.OVERDUE) {
        await this.prisma.navigationStep.update({
          where: { id: stepId },
          data: { status: NavigationStepStatus.OVERDUE },
        });
        updatedStep.status = NavigationStepStatus.OVERDUE;
      }
      // Verificar e criar alerta se necessário
      await this.checkAndCreateAlertForStep(updatedStep, tenantId);
    }

    return updatedStep;
  }

  /**
   * Inicializa etapas de navegação para um paciente baseado no tipo de câncer e etapa atual
   * Remove etapas existentes e cria novas para garantir que estejam atualizadas
   */
  async initializeNavigationSteps(
    patientId: string,
    tenantId: string,
    cancerType: string,
    currentStage: JourneyStage
  ): Promise<void> {
    // Garantir que currentStage não seja null
    const stage = currentStage || JourneyStage.SCREENING;
    
    console.log(
      `[OncologyNavigation] Inicializando etapas para paciente ${patientId}, tipo: ${cancerType}, estágio: ${stage}`
    );

    // Remover etapas existentes para este paciente e tipo de câncer
    // Isso garante que as etapas estejam sempre atualizadas conforme o estágio atual
    await this.prisma.navigationStep.deleteMany({
      where: {
        patientId,
        tenantId,
        cancerType,
      },
    });

    // Obter regras específicas para o tipo de câncer
    const steps = this.getNavigationStepsForCancerType(
      cancerType.toLowerCase(),
      stage
    );

    console.log(
      `[OncologyNavigation] Encontradas ${steps.length} etapas para ${cancerType} no estágio ${stage}`
    );

    if (steps.length === 0) {
      console.warn(
        `[OncologyNavigation] Nenhuma etapa encontrada para tipo ${cancerType} no estágio ${stage}`
      );
      return;
    }

    // Obter journey do paciente
    const journey = await this.prisma.patientJourney.findUnique({
      where: { patientId },
    });

    // Criar todas as etapas
    let createdCount = 0;
    for (const stepConfig of steps) {
      try {
        await this.prisma.navigationStep.create({
          data: {
            tenantId,
            patientId,
            journeyId: journey?.id,
            cancerType: cancerType.toLowerCase(),
            journeyStage: stepConfig.journeyStage,
            stepKey: stepConfig.stepKey,
            stepName: stepConfig.stepName,
            stepDescription: stepConfig.stepDescription,
            isRequired: stepConfig.isRequired ?? true,
            expectedDate: stepConfig.expectedDate,
            dueDate: stepConfig.dueDate,
            status: NavigationStepStatus.PENDING,
            isCompleted: false,
          },
        });
        createdCount++;
      } catch (error) {
        console.error(
          `[OncologyNavigation] Erro ao criar etapa ${stepConfig.stepKey}:`,
          error
        );
        throw error;
      }
    }

    console.log(
      `[OncologyNavigation] Criadas ${createdCount} etapas para paciente ${patientId}`
    );
  }

  /**
   * Inicializa etapas de navegação para todos os pacientes que têm tipo de câncer
   * mas ainda não têm etapas definidas
   */
  async initializeAllPatientsSteps(tenantId: string): Promise<{
    initialized: number;
    skipped: number;
    errors: number;
  }> {
    // Buscar todos os pacientes com tipo de câncer mas sem etapas
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId,
        OR: [
          { cancerType: { not: null } },
          {
            cancerDiagnoses: {
              some: {
                isActive: true,
                isPrimary: true,
              },
            },
          },
        ],
      },
      include: {
        cancerDiagnoses: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
        },
        navigationSteps: {
          select: { id: true },
          take: 1, // Apenas verificar se existe
        },
      },
    });

    let initialized = 0;
    let skipped = 0;
    let errors = 0;

    for (const patient of patients) {
      try {
        // Verificar se já tem etapas
        if (patient.navigationSteps && patient.navigationSteps.length > 0) {
          skipped++;
          continue;
        }

        // Determinar tipo de câncer (prioridade: cancerType > primeiro diagnóstico primário)
        const cancerTypeRaw =
          patient.cancerType ||
          patient.cancerDiagnoses?.[0]?.cancerType ||
          null;

        if (!cancerTypeRaw) {
          skipped++;
          continue;
        }

        // Converter para minúsculas para garantir consistência
        const cancerType = String(cancerTypeRaw).toLowerCase();

        // Usar currentStage do paciente ou default SCREENING
        const currentStage = patient.currentStage || JourneyStage.SCREENING;

        // Inicializar etapas
        await this.initializeNavigationSteps(
          patient.id,
          tenantId,
          cancerType,
          currentStage
        );

        initialized++;
      } catch (error) {
        console.error(
          `Erro ao inicializar etapas para paciente ${patient.id}:`,
          error
        );
        errors++;
      }
    }

    return { initialized, skipped, errors };
  }

  /**
   * Verifica e cria alertas para etapas atrasadas
   * Evita criar alertas duplicados verificando se já existe um alerta pendente para a mesma etapa
   */
  async checkOverdueSteps(tenantId: string): Promise<{
    checked: number;
    markedOverdue: number;
    alertsCreated: number;
  }> {
    const now = new Date();
    const overdueSteps = await this.prisma.navigationStep.findMany({
      where: {
        tenantId,
        status: {
          in: [
            NavigationStepStatus.PENDING,
            NavigationStepStatus.IN_PROGRESS,
          ],
        },
        isCompleted: false,
        dueDate: {
          lt: now,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            cancerType: true,
            currentStage: true,
          },
        },
      },
    });

    let markedOverdue = 0;
    let alertsCreated = 0;

    for (const step of overdueSteps) {
      // Marcar como atrasada se ainda não estiver marcada
      if (step.status !== NavigationStepStatus.OVERDUE) {
        await this.prisma.navigationStep.update({
          where: { id: step.id },
          data: { status: NavigationStepStatus.OVERDUE },
        });
        markedOverdue++;
      }

      // Verificar se já existe um alerta pendente para esta etapa
      // Buscar todos os alertas pendentes do tipo NAVIGATION_DELAY para este paciente
      // e verificar se algum tem o stepId no context
      const existingAlerts = await this.prisma.alert.findMany({
        where: {
          tenantId,
          patientId: step.patientId,
          type: AlertType.NAVIGATION_DELAY,
          status: {
            in: ['PENDING', 'ACKNOWLEDGED'],
          },
        },
        select: {
          id: true,
          context: true,
        },
      });

      // Verificar se algum alerta tem o stepId no context
      const existingAlert = existingAlerts.find((alert) => {
        if (!alert.context || typeof alert.context !== 'object') {
          return false;
        }
        const context = alert.context as { stepId?: string };
        return context.stepId === step.id;
      });

      // Criar alerta apenas se não existir um alerta pendente para esta etapa
      if (!existingAlert) {
        const daysOverdue = Math.floor(
          (now.getTime() - step.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.alertsService.create(
          {
            patientId: step.patientId,
            type: AlertType.NAVIGATION_DELAY,
            severity: this.getSeverityForStep(step),
            message: `Etapa atrasada: ${step.stepName}${step.stepDescription ? ` - ${step.stepDescription}` : ''} (${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'} de atraso)`,
            context: {
              stepId: step.id,
              stepKey: step.stepKey,
              journeyStage: step.journeyStage,
              dueDate: step.dueDate,
              daysOverdue,
            },
          },
          tenantId
        );
        alertsCreated++;
      }
    }

    return {
      checked: overdueSteps.length,
      markedOverdue,
      alertsCreated,
    };
  }

  /**
   * Verifica e cria alerta para uma etapa específica se estiver atrasada
   * Método auxiliar usado ao criar/atualizar etapas
   */
  private async checkAndCreateAlertForStep(
    step: any,
    tenantId: string
  ): Promise<void> {
    if (!step.dueDate || step.isCompleted) {
      return;
    }

    const now = new Date();
    if (step.dueDate >= now) {
      return; // Não está atrasada ainda
    }

    // Verificar se já existe um alerta pendente para esta etapa
    const existingAlerts = await this.prisma.alert.findMany({
      where: {
        tenantId,
        patientId: step.patientId,
        type: AlertType.NAVIGATION_DELAY,
        status: {
          in: ['PENDING', 'ACKNOWLEDGED'],
        },
      },
      select: {
        id: true,
        context: true,
      },
    });

    // Verificar se algum alerta tem o stepId no context
    const existingAlert = existingAlerts.find((alert) => {
      if (!alert.context || typeof alert.context !== 'object') {
        return false;
      }
      const context = alert.context as { stepId?: string };
      return context.stepId === step.id;
    });

    // Criar alerta apenas se não existir um alerta pendente para esta etapa
    if (!existingAlert) {
      const daysOverdue = Math.floor(
        (now.getTime() - step.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.alertsService.create(
        {
          patientId: step.patientId,
          type: AlertType.NAVIGATION_DELAY,
          severity: this.getSeverityForStep(step),
          message: `Etapa atrasada: ${step.stepName}${step.stepDescription ? ` - ${step.stepDescription}` : ''} (${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'} de atraso)`,
          context: {
            stepId: step.id,
            stepKey: step.stepKey,
            journeyStage: step.journeyStage,
            dueDate: step.dueDate,
            daysOverdue,
          },
        },
        tenantId
      );
    }
  }

  /**
   * Retorna as etapas esperadas para cada tipo de câncer em cada fase da jornada
   */
  private getNavigationStepsForCancerType(
    cancerType: string,
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const type = cancerType.toLowerCase();

    switch (type) {
      case 'colorectal':
        return this.getColorectalCancerSteps(currentStage);
      case 'breast':
        return this.getBreastCancerSteps(currentStage);
      case 'lung':
        return this.getLungCancerSteps(currentStage);
      case 'prostate':
        return this.getProstateCancerSteps(currentStage);
      case 'kidney':
        return this.getKidneyCancerSteps(currentStage);
      case 'bladder':
        return this.getBladderCancerSteps(currentStage);
      case 'testicular':
        return this.getTesticularCancerSteps(currentStage);
      default:
        return this.getGenericCancerSteps(currentStage);
    }
  }

  /**
   * Etapas para câncer colorretal
   */
  private getColorectalCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {

    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'fecal_occult_blood',
        stepName: 'Pesquisa de Sangue Oculto nas Fezes',
        stepDescription:
          'Exame de rastreio inicial para detecção de sangue oculto nas fezes',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30), // Prazo de 30 dias
      });

      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'colonoscopy',
        stepName: 'Colonoscopia',
        stepDescription:
          'Exame de rastreio ou diagnóstico. Se PSOF positivo ou sintomas, realizar colonoscopia',
        isRequired: false, // Depende do resultado do PSOF
        dueDate: this.addDays(new Date(), 60), // Prazo de 60 dias se necessário
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'colonoscopy_with_biopsy',
        stepName: 'Colonoscopia com Biópsia',
        stepDescription:
          'Colonoscopia com coleta de material para análise anatomopatológica',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14), // Urgente: 14 dias
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription:
          'Resultado da biópsia confirmando diagnóstico e tipo histológico',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21), // 21 dias após biópsia
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'staging_ct_abdomen',
        stepName: 'TC de Abdome e Pelve',
        stepDescription:
          'Tomografia computadorizada para estadiamento (avaliar metástases)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28), // 28 dias após diagnóstico
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'staging_ct_thorax',
        stepName: 'TC de Tórax',
        stepDescription: 'Tomografia de tórax para avaliar metástases pulmonares',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'genetic_testing',
        stepName: 'Teste Genético (MSI, KRAS, NRAS, BRAF)',
        stepDescription:
          'Testes moleculares para orientar tratamento (especialmente se estágio avançado)',
        isRequired: false, // Depende do estadiamento
        dueDate: this.addDays(new Date(), 35),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'cea_baseline',
        stepName: 'CEA Basal',
        stepDescription:
          'Dosagem de CEA (antígeno carcinoembrionário) como marcador tumoral basal',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'surgical_evaluation',
        stepName: 'Avaliação Cirúrgica',
        stepDescription:
          'Consulta com cirurgião para planejamento da ressecção',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'colectomy',
        stepName: 'Colectomia (Cirurgia)',
        stepDescription:
          'Ressecção cirúrgica do tumor. Timing depende do estadiamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 42), // 6 semanas após diagnóstico
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'adjuvant_chemotherapy',
        stepName: 'Quimioterapia Adjuvante',
        stepDescription:
          'QT adjuvante (FOLFOX ou CAPOX) se estágio III ou alto risco estágio II',
        isRequired: false, // Depende do estadiamento pós-cirúrgico
        dueDate: this.addDays(new Date(), 90), // Iniciar 4-8 semanas pós-cirurgia
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radiotherapy',
        stepName: 'Radioterapia',
        stepDescription:
          'RT neoadjuvante ou adjuvante para câncer retal (T3-T4 ou N+)',
        isRequired: false, // Apenas para reto
        dueDate: this.addDays(new Date(), 60),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'cea_3months',
        stepName: 'CEA aos 3 meses',
        stepDescription: 'Primeira dosagem de CEA pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'colonoscopy_1year',
        stepName: 'Colonoscopia de Controle (1 ano)',
        stepDescription:
          'Primeira colonoscopia de seguimento 1 ano após cirurgia',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_annual',
        stepName: 'TC Abdome/Pelve Anual',
        stepDescription:
          'TC anual para rastreio de recidiva (por 3-5 anos)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'colonoscopy_3years',
        stepName: 'Colonoscopia de Controle (3 anos)',
        stepDescription: 'Segunda colonoscopia de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 1095), // 3 anos
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de mama
   */
  private getBreastCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'mammography',
        stepName: 'Mamografia',
        stepDescription: 'Exame de rastreio para detecção precoce',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });

      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'breast_ultrasound',
        stepName: 'Ultrassonografia de Mama',
        stepDescription: 'Complementar à mamografia em mamas densas',
        isRequired: false,
        dueDate: this.addDays(new Date(), 45),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'breast_biopsy',
        stepName: 'Biópsia de Mama',
        stepDescription: 'Biópsia core ou excisional para confirmação diagnóstica',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Tipo histológico, grau, receptor hormonal, HER2',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'breast_mri',
        stepName: 'Ressonância Magnética de Mama',
        stepDescription: 'Avaliar extensão e multifocalidade (se indicado)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'staging_ct_thorax_abdomen',
        stepName: 'TC de Tórax, Abdome e Pelve',
        stepDescription: 'Estadiamento para avaliar metástases',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'bone_scan',
        stepName: 'Cintilografia Óssea',
        stepDescription: 'Avaliar metástases ósseas (se sintomas ou estágio avançado)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 35),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'genetic_counseling',
        stepName: 'Aconselhamento Genético',
        stepDescription: 'Avaliar risco hereditário (BRCA1/BRCA2) se indicado',
        isRequired: false,
        dueDate: this.addDays(new Date(), 42),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'surgical_evaluation',
        stepName: 'Avaliação Cirúrgica',
        stepDescription: 'Consulta com cirurgião para planejamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'neoadjuvant_chemotherapy',
        stepName: 'Quimioterapia Neoadjuvante',
        stepDescription: 'QT antes da cirurgia (se tumor grande ou HER2+)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'mastectomy_or_lumpectomy',
        stepName: 'Mastectomia ou Quadrantectomia',
        stepDescription: 'Cirurgia de ressecção do tumor',
        isRequired: true,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'sentinel_lymph_node',
        stepName: 'Biópsia de Linfonodo Sentinela',
        stepDescription: 'Avaliar comprometimento linfonodal',
        isRequired: true,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'adjuvant_chemotherapy',
        stepName: 'Quimioterapia Adjuvante',
        stepDescription: 'QT após cirurgia (se indicado pelo estadiamento)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radiotherapy',
        stepName: 'Radioterapia',
        stepDescription: 'RT após cirurgia conservadora ou mastectomia com risco',
        isRequired: false,
        dueDate: this.addDays(new Date(), 120),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'hormonal_therapy',
        stepName: 'Hormonioterapia',
        stepDescription: 'Tamoxifeno ou inibidor de aromatase (se receptor positivo)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'targeted_therapy',
        stepName: 'Terapia Alvo (Trastuzumab)',
        stepDescription: 'Se HER2 positivo',
        isRequired: false,
        dueDate: this.addDays(new Date(), 90),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'mammography_6months',
        stepName: 'Mamografia aos 6 meses',
        stepDescription: 'Primeira mamografia pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'mammography_annual',
        stepName: 'Mamografia Anual',
        stepDescription: 'Mamografia anual por 5 anos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'clinical_exam_6months',
        stepName: 'Exame Clínico a cada 6 meses',
        stepDescription: 'Avaliação clínica por 3 anos, depois anual',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de pulmão
   */
  private getLungCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'low_dose_ct',
        stepName: 'TC de Tórax de Baixa Dose',
        stepDescription: 'Rastreio em pacientes de alto risco (tabagistas)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_thorax_contrast',
        stepName: 'TC de Tórax com Contraste',
        stepDescription: 'Avaliar lesão pulmonar e linfonodos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 7),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'bronchoscopy_biopsy',
        stepName: 'Broncoscopia com Biópsia',
        stepDescription: 'Coleta de material para diagnóstico',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Tipo histológico (adenocarcinoma, escamoso, etc.)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pet_ct',
        stepName: 'PET-CT',
        stepDescription: 'Estadiamento completo (metástases)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'molecular_testing',
        stepName: 'Testes Moleculares (EGFR, ALK, ROS1, PD-L1)',
        stepDescription: 'Biomarcadores para terapia alvo e imunoterapia',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'brain_mri',
        stepName: 'Ressonância Magnética de Crânio',
        stepDescription: 'Avaliar metástases cerebrais (se sintomas ou estágio avançado)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 35),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'surgical_evaluation',
        stepName: 'Avaliação Cirúrgica',
        stepDescription: 'Avaliar ressecabilidade (estágios I-II)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'lobectomy_or_pneumonectomy',
        stepName: 'Lobectomia ou Pneumonectomia',
        stepDescription: 'Cirurgia de ressecção (se estágio inicial)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'chemotherapy',
        stepName: 'Quimioterapia',
        stepDescription: 'QT adjuvante ou paliativa conforme estadiamento',
        isRequired: false,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radiotherapy',
        stepName: 'Radioterapia',
        stepDescription: 'RT adjuvante ou paliativa',
        isRequired: false,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'targeted_therapy',
        stepName: 'Terapia Alvo',
        stepDescription: 'Inibidores de tirosina quinase (se mutação presente)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'immunotherapy',
        stepName: 'Imunoterapia',
        stepDescription: 'Anti-PD-1/PD-L1 (se PD-L1 positivo)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 28),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_thorax_3months',
        stepName: 'TC de Tórax aos 3 meses',
        stepDescription: 'Primeira TC pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_thorax_6months',
        stepName: 'TC de Tórax aos 6 meses',
        stepDescription: 'Segunda TC de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_thorax_annual',
        stepName: 'TC de Tórax Anual',
        stepDescription: 'TC anual por 2-3 anos, depois conforme necessário',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de próstata
   */
  private getProstateCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'psa_test',
        stepName: 'Dosagem de PSA',
        stepDescription: 'Antígeno prostático específico',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });

      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'digital_rectal_exam',
        stepName: 'Toque Retal',
        stepDescription: 'Exame físico da próstata',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'prostate_biopsy',
        stepName: 'Biópsia de Próstata',
        stepDescription: 'Biópsia guiada por ultrassom transretal',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Gleason score, extensão, margens',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'prostate_mri',
        stepName: 'Ressonância Magnética de Próstata',
        stepDescription: 'Avaliar extensão local e planejar tratamento',
        isRequired: false,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'bone_scan',
        stepName: 'Cintilografia Óssea',
        stepDescription: 'Avaliar metástases ósseas (se PSA alto ou sintomas)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 35),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_abdomen_pelvis',
        stepName: 'TC de Abdome e Pelve',
        stepDescription: 'Avaliar linfonodos e metástases viscerais',
        isRequired: false,
        dueDate: this.addDays(new Date(), 35),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'treatment_decision',
        stepName: 'Decisão de Tratamento',
        stepDescription: 'Cirurgia, radioterapia ou vigilância ativa',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radical_prostatectomy',
        stepName: 'Prostatectomia Radical',
        stepDescription: 'Cirurgia de remoção da próstata (se escolhida)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radiotherapy',
        stepName: 'Radioterapia',
        stepDescription: 'RT externa ou braquiterapia (se escolhida)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'hormonal_therapy',
        stepName: 'Hormonioterapia',
        stepDescription: 'Bloqueio androgênico (se doença avançada)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'psa_3months',
        stepName: 'PSA aos 3 meses',
        stepDescription: 'Primeira dosagem pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'psa_6months',
        stepName: 'PSA aos 6 meses',
        stepDescription: 'Segunda dosagem de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'psa_annual',
        stepName: 'PSA Anual',
        stepDescription: 'Dosagem anual por 5 anos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de rim (renal)
   */
  private getKidneyCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'abdominal_ultrasound',
        stepName: 'Ultrassonografia de Abdome',
        stepDescription: 'Rastreio de massa renal',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_abdomen_contrast',
        stepName: 'TC de Abdome com Contraste',
        stepDescription: 'Caracterizar massa renal e estadiamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'biopsy_or_surgery',
        stepName: 'Biópsia ou Cirurgia Diagnóstica',
        stepDescription: 'Biópsia percutânea ou nefrectomia parcial/total',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Tipo histológico (carcinoma de células claras, etc.)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_thorax',
        stepName: 'TC de Tórax',
        stepDescription: 'Avaliar metástases pulmonares',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'bone_scan',
        stepName: 'Cintilografia Óssea',
        stepDescription: 'Avaliar metástases ósseas (se sintomas)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 35),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'surgical_evaluation',
        stepName: 'Avaliação Cirúrgica',
        stepDescription: 'Planejamento de nefrectomia parcial ou total',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'partial_or_radical_nephrectomy',
        stepName: 'Nefrectomia Parcial ou Radical',
        stepDescription: 'Cirurgia de ressecção do tumor',
        isRequired: true,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'targeted_therapy',
        stepName: 'Terapia Alvo',
        stepDescription: 'Sunitinibe, pazopanibe ou outros (se doença avançada)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'immunotherapy',
        stepName: 'Imunoterapia',
        stepDescription: 'Nivolumabe, ipilimumabe (se doença avançada)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_3months',
        stepName: 'TC de Abdome aos 3 meses',
        stepDescription: 'Primeira TC pós-cirurgia',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_6months',
        stepName: 'TC de Abdome aos 6 meses',
        stepDescription: 'Segunda TC de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_annual',
        stepName: 'TC de Abdome Anual',
        stepDescription: 'TC anual por 3-5 anos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de bexiga
   */
  private getBladderCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'urine_cytology',
        stepName: 'Citologia Urinária',
        stepDescription: 'Rastreio de células neoplásicas na urina',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'cystoscopy',
        stepName: 'Cistoscopia',
        stepDescription: 'Visualização da bexiga e biópsia',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'transurethral_resection',
        stepName: 'Ressecção Transuretral de Bexiga (RTU)',
        stepDescription: 'Remoção do tumor e confirmação diagnóstica',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Grau (baixo/alto), invasão muscular',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_urography',
        stepName: 'Urografia por TC',
        stepDescription: 'Avaliar trato urinário superior e estadiamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_thorax',
        stepName: 'TC de Tórax',
        stepDescription: 'Avaliar metástases pulmonares',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'intravesical_bcg',
        stepName: 'BCG Intravesical',
        stepDescription: 'Imunoterapia intravesical (tumores não-musculares invasivos)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 42),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radical_cystectomy',
        stepName: 'Cistectomia Radical',
        stepDescription: 'Remoção da bexiga (tumores musculares invasivos)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'neobladder_or_urostomy',
        stepName: 'Neobexiga ou Urostomia',
        stepDescription: 'Reconstrução do trato urinário após cistectomia',
        isRequired: false,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'chemotherapy',
        stepName: 'Quimioterapia',
        stepDescription: 'QT neoadjuvante ou adjuvante (MVAC ou GC)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'cystoscopy_3months',
        stepName: 'Cistoscopia aos 3 meses',
        stepDescription: 'Primeira cistoscopia pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'cystoscopy_6months',
        stepName: 'Cistoscopia aos 6 meses',
        stepDescription: 'Segunda cistoscopia de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'cystoscopy_annual',
        stepName: 'Cistoscopia Anual',
        stepDescription: 'Cistoscopia anual por 5 anos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });
    }

    return steps;
  }

  /**
   * Etapas para câncer de testículo
   */
  private getTesticularCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // RASTREIO (SCREENING)
    if (currentStage === JourneyStage.SCREENING) {
      steps.push({
        journeyStage: JourneyStage.SCREENING,
        stepKey: 'testicular_ultrasound',
        stepName: 'Ultrassonografia de Testículo',
        stepDescription: 'Avaliar massa testicular',
        isRequired: true,
        dueDate: this.addDays(new Date(), 7),
      });
    }

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'radical_orchiectomy',
        stepName: 'Orquiectomia Radical',
        stepDescription: 'Remoção do testículo (diagnóstico e tratamento inicial)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 7),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Tipo histológico (seminoma vs não-seminoma)',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'tumor_markers',
        stepName: 'Marcadores Tumorais (AFP, HCG, LDH)',
        stepDescription: 'Dosagem pré e pós-operatória',
        isRequired: true,
        dueDate: this.addDays(new Date(), 7),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_abdomen_pelvis',
        stepName: 'TC de Abdome e Pelve',
        stepDescription: 'Avaliar linfonodos retroperitoneais',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'ct_thorax',
        stepName: 'TC de Tórax',
        stepDescription: 'Avaliar metástases pulmonares',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'retroperitoneal_lymph_node_dissection',
        stepName: 'Linfadenectomia Retroperitoneal',
        stepDescription: 'Remoção de linfonodos (se indicado)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 60),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'chemotherapy',
        stepName: 'Quimioterapia',
        stepDescription: 'BEP ou EP (bleomicina, etoposido, cisplatina)',
        isRequired: false,
        dueDate: this.addDays(new Date(), 30),
      });

      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'radiotherapy',
        stepName: 'Radioterapia',
        stepDescription: 'RT para seminoma estágio I-II',
        isRequired: false,
        dueDate: this.addDays(new Date(), 30),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'tumor_markers_1month',
        stepName: 'Marcadores Tumorais aos 1 mês',
        stepDescription: 'Primeira dosagem pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 30),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_3months',
        stepName: 'TC de Abdome aos 3 meses',
        stepDescription: 'Primeira TC pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_6months',
        stepName: 'TC de Abdome aos 6 meses',
        stepDescription: 'Segunda TC de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'ct_abdomen_annual',
        stepName: 'TC de Abdome Anual',
        stepDescription: 'TC anual por 5 anos',
        isRequired: true,
        dueDate: this.addDays(new Date(), 365),
      });
    }

    return steps;
  }

  /**
   * Etapas genéricas para tipos de câncer não especificados
   */
  private getGenericCancerSteps(
    currentStage: JourneyStage
  ): Array<{
    journeyStage: JourneyStage;
    stepKey: string;
    stepName: string;
    stepDescription: string;
    isRequired: boolean;
    expectedDate?: Date;
    dueDate?: Date;
  }> {
    const steps: Array<{
      journeyStage: JourneyStage;
      stepKey: string;
      stepName: string;
      stepDescription: string;
      isRequired: boolean;
      expectedDate?: Date;
      dueDate?: Date;
    }> = [];

    // DIAGNÓSTICO (DIAGNOSIS)
    if (
      currentStage === JourneyStage.DIAGNOSIS ||
      currentStage === JourneyStage.SCREENING
    ) {
      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'biopsy',
        stepName: 'Biópsia',
        stepDescription: 'Coleta de material para diagnóstico',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'pathology_report',
        stepName: 'Laudo Anatomopatológico',
        stepDescription: 'Confirmação diagnóstica e tipo histológico',
        isRequired: true,
        dueDate: this.addDays(new Date(), 21),
      });

      steps.push({
        journeyStage: JourneyStage.DIAGNOSIS,
        stepKey: 'staging_imaging',
        stepName: 'Exames de Estadiamento',
        stepDescription: 'TC ou PET-CT para avaliar extensão da doença',
        isRequired: true,
        dueDate: this.addDays(new Date(), 28),
      });
    }

    // TRATAMENTO (TREATMENT)
    if (
      currentStage === JourneyStage.TREATMENT ||
      currentStage === JourneyStage.DIAGNOSIS
    ) {
      steps.push({
        journeyStage: JourneyStage.TREATMENT,
        stepKey: 'treatment_planning',
        stepName: 'Planejamento de Tratamento',
        stepDescription: 'Definir estratégia terapêutica',
        isRequired: true,
        dueDate: this.addDays(new Date(), 14),
      });
    }

    // SEGUIMENTO (FOLLOW_UP)
    if (
      currentStage === JourneyStage.FOLLOW_UP ||
      currentStage === JourneyStage.TREATMENT
    ) {
      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'follow_up_3months',
        stepName: 'Consulta de Seguimento aos 3 meses',
        stepDescription: 'Primeira consulta pós-tratamento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 90),
      });

      steps.push({
        journeyStage: JourneyStage.FOLLOW_UP,
        stepKey: 'follow_up_6months',
        stepName: 'Consulta de Seguimento aos 6 meses',
        stepDescription: 'Segunda consulta de seguimento',
        isRequired: true,
        dueDate: this.addDays(new Date(), 180),
      });
    }

    return steps;
  }

  /**
   * Determina severidade do alerta baseado na etapa
   */
  private getSeverityForStep(step: any): AlertSeverity {
    // Etapas críticas de diagnóstico e tratamento são HIGH ou CRITICAL
    if (
      step.journeyStage === JourneyStage.DIAGNOSIS ||
      step.journeyStage === JourneyStage.TREATMENT
    ) {
      if (step.isRequired) {
        const daysOverdue = Math.floor(
          (new Date().getTime() - step.dueDate!.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return daysOverdue > 14 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH;
      }
      return AlertSeverity.MEDIUM;
    }

    // Etapas de rastreio e seguimento são MEDIUM ou LOW
    if (step.isRequired) {
      return AlertSeverity.MEDIUM;
    }
    return AlertSeverity.LOW;
  }

  /**
   * Helper: adiciona dias a uma data
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

