import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar Tenant de teste
  const tenant = await prisma.tenant.upsert({
    where: { schemaName: 'hospital_teste' },
    update: {},
    create: {
      name: 'Hospital de Teste',
      schemaName: 'hospital_teste',
      settings: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
      },
    },
  });

  console.log('✅ Tenant criado:', tenant.name);

  // Criar usuários de teste
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'admin@hospitalteste.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const oncologist = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'oncologista@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'oncologista@hospitalteste.com',
      password: hashedPassword,
      name: 'Dr. João Silva',
      role: 'ONCOLOGIST',
      tenantId: tenant.id,
    },
  });

  const nurse = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'enfermeira@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'enfermeira@hospitalteste.com',
      password: hashedPassword,
      name: 'Maria Santos',
      role: 'NURSE',
      tenantId: tenant.id,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'coordenador@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'coordenador@hospitalteste.com',
      password: hashedPassword,
      name: 'Carlos Oliveira',
      role: 'COORDINATOR',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Usuários criados:');
  console.log('  - Admin:', admin.email);
  console.log('  - Oncologista:', oncologist.email);
  console.log('  - Enfermeira:', nurse.email);
  console.log('  - Coordenador:', coordinator.email);

  // Limpar pacientes existentes antes de criar novos
  console.log('🧹 Limpando pacientes existentes...');
  await prisma.patient.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log('✅ Pacientes anteriores removidos');

  // Criar pacientes de teste - 4 pacientes em cada tipo de câncer (1 em cada estágio)
  // Tipos de câncer: breast, lung, colorectal, prostate, kidney, bladder, testicular
  // Estágios: SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP
  // Total: 7 tipos × 4 estágios = 28 pacientes

  const cancerTypes = [
    { type: 'breast', name: 'Mama', gender: 'female' as const },
    { type: 'lung', name: 'Pulmão', gender: 'male' as const },
    { type: 'colorectal', name: 'Colorretal', gender: 'male' as const },
    { type: 'prostate', name: 'Próstata', gender: 'male' as const },
    { type: 'kidney', name: 'Rim', gender: 'male' as const },
    { type: 'bladder', name: 'Bexiga', gender: 'male' as const },
    { type: 'testicular', name: 'Testículo', gender: 'male' as const },
  ];

  const journeyStages = [
    {
      stage: 'SCREENING' as const,
      name: 'Rastreio',
      priorityScore: 20,
      priorityCategory: 'LOW' as const,
      status: 'ACTIVE' as const,
      stageValue: null,
    },
    {
      stage: 'DIAGNOSIS' as const,
      name: 'Diagnóstico',
      priorityScore: 65,
      priorityCategory: 'HIGH' as const,
      status: 'ACTIVE' as const,
      stageValue: null,
    },
    {
      stage: 'TREATMENT' as const,
      name: 'Tratamento',
      priorityScore: 75,
      priorityCategory: 'HIGH' as const,
      status: 'IN_TREATMENT' as const,
      stageValue: 'IIIA',
    },
    {
      stage: 'FOLLOW_UP' as const,
      name: 'Seguimento',
      priorityScore: 30,
      priorityCategory: 'LOW' as const,
      status: 'FOLLOW_UP' as const,
      stageValue: 'II',
    },
  ];

  const patients: Array<{
    id: string;
    cancerType: string;
    currentStage: string;
    name: string;
  }> = [];

  let patientCounter = 1;
  let phoneCounter = 9999999999;
  let emailCounter = 1;

  for (const cancer of cancerTypes) {
    for (const journeyStage of journeyStages) {
      const name = `${cancer.name} - ${journeyStage.name}`;
      const phone = `+5511${phoneCounter}`;
      const email = `paciente${emailCounter}@email.com`;

      const patient = await prisma.patient.create({
        data: {
          tenantId: tenant.id,
          name,
          birthDate: new Date(
            1970 + patientCounter,
            patientCounter % 12,
            (patientCounter % 28) + 1
          ),
          gender: cancer.gender,
          phone,
          email,
          cancerType: cancer.type,
          stage: journeyStage.stageValue,
          currentStage: journeyStage.stage,
          priorityScore: journeyStage.priorityScore,
          priorityCategory: journeyStage.priorityCategory,
          priorityReason: `Paciente em ${journeyStage.name.toLowerCase()} - ${cancer.name}`,
          status: journeyStage.status,
        },
      });

      patients.push({
        id: patient.id,
        cancerType: cancer.type,
        currentStage: journeyStage.stage,
        name: patient.name,
      });

      patientCounter++;
      phoneCounter--;
      emailCounter++;
    }
  }

  // Criar paciente em tratamento paliativo
  const palliativePatient = await prisma.patient.create({
    data: {
      tenantId: tenant.id,
      name: 'Paciente Paliativo - Cuidados Paliativos',
      birthDate: new Date(1955, 5, 15),
      gender: 'male',
      phone: `+5511999999999`,
      email: `paciente.paliativo@email.com`,
      cancerType: 'lung', // Tipo de câncer original
      stage: 'IV',
      currentStage: 'FOLLOW_UP',
      priorityScore: 85,
      priorityCategory: 'HIGH',
      priorityReason: 'Paciente em tratamento paliativo - necessita acompanhamento contínuo',
      status: 'PALLIATIVE_CARE',
      ehrPatientId: null,
      lastSyncAt: null,
      lastInteraction: new Date(),
    },
  });

  patients.push({
    id: palliativePatient.id,
    cancerType: 'lung',
    currentStage: 'FOLLOW_UP',
    name: palliativePatient.name,
  });

  console.log(
    `✅ Pacientes criados: ${patients.length} (${cancerTypes.length} tipos × ${journeyStages.length} estágios + 1 paciente paliativo)`
  );
  console.log('📊 Distribuição por tipo de câncer:');
  for (const cancer of cancerTypes) {
    const cancerPatients = patients.filter((p) => p.cancerType === cancer.type);
    console.log(
      `  ${cancer.name}: ${cancerPatients.length} pacientes (${cancerPatients.map((p) => p.currentStage).join(', ')})`
    );
  }
  console.log(`  💜 Tratamento Paliativo: 1 paciente`);

  // Criar PatientJourney para cada paciente conforme seu estágio
  for (const patient of patients) {
    const journeyData: any = {
      tenantId: tenant.id,
      patientId: patient.id,
    };

    // Verificar se é paciente paliativo
    const isPalliative = patient.id === palliativePatient.id;

    if (isPalliative) {
      // PatientJourney para paciente paliativo
      journeyData.screeningDate = new Date('2023-06-01');
      journeyData.screeningResult = `Rastreio positivo - ${patient.cancerType}`;
      journeyData.diagnosisDate = new Date('2023-07-15');
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = new Date('2023-08-01');
      journeyData.treatmentStartDate = new Date('2023-09-01');
      journeyData.treatmentType = 'CHEMOTHERAPY';
      journeyData.treatmentProtocol = `Protocolo inicial - ${patient.cancerType}`;
      journeyData.currentCycle = null; // Tratamento paliativo
      journeyData.totalCycles = null;
      journeyData.lastFollowUpDate = new Date('2024-11-01');
      journeyData.nextFollowUpDate = new Date('2024-12-15');
      journeyData.currentStep = 'Cuidados paliativos - controle de sintomas';
      journeyData.nextStep = 'Avaliação de qualidade de vida';
      journeyData.blockers = [];
    } else if (patient.currentStage === 'SCREENING') {
      journeyData.screeningDate = new Date('2024-12-01');
      journeyData.screeningResult = `Rastreio agendado - ${patient.cancerType}`;
      journeyData.diagnosisDate = null;
      journeyData.diagnosisConfirmed = false;
      journeyData.stagingDate = null;
      journeyData.treatmentStartDate = null;
      journeyData.treatmentType = null;
      journeyData.treatmentProtocol = null;
      journeyData.currentCycle = null;
      journeyData.totalCycles = null;
      journeyData.nextFollowUpDate = null;
    } else if (patient.currentStage === 'DIAGNOSIS') {
      journeyData.screeningDate = new Date('2024-11-15');
      journeyData.screeningResult = `Achado suspeito detectado - ${patient.cancerType}`;
      journeyData.diagnosisDate = new Date('2024-11-25');
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = null; // Estadiamento em andamento
      journeyData.treatmentStartDate = null;
      journeyData.treatmentType = null;
      journeyData.treatmentProtocol = null;
      journeyData.currentCycle = null;
      journeyData.totalCycles = null;
      journeyData.nextFollowUpDate = null;
    } else if (patient.currentStage === 'TREATMENT') {
      journeyData.screeningDate = new Date('2024-01-15');
      journeyData.screeningResult = `Rastreio positivo - ${patient.cancerType}`;
      journeyData.diagnosisDate = new Date('2024-02-01');
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = new Date('2024-02-10');
      journeyData.treatmentStartDate = new Date('2024-03-01');
      journeyData.treatmentType = 'CHEMOTHERAPY';
      journeyData.treatmentProtocol = `Protocolo padrão - ${patient.cancerType}`;
      journeyData.currentCycle = 3;
      journeyData.totalCycles = 8;
      journeyData.nextFollowUpDate = new Date('2024-12-20');
    } else if (patient.currentStage === 'FOLLOW_UP') {
      journeyData.screeningDate = new Date('2023-06-10');
      journeyData.screeningResult = `Rastreio inicial - ${patient.cancerType}`;
      journeyData.diagnosisDate = new Date('2023-07-05');
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = new Date('2023-07-15');
      journeyData.treatmentStartDate = new Date('2023-08-01');
      journeyData.treatmentType = 'SURGERY';
      journeyData.treatmentProtocol = `Tratamento cirúrgico - ${patient.cancerType}`;
      journeyData.currentCycle = null;
      journeyData.totalCycles = null;
      journeyData.lastFollowUpDate = new Date('2023-09-15');
      journeyData.nextFollowUpDate = new Date('2024-12-20');
    }

    await prisma.patientJourney.upsert({
      where: { patientId: patient.id },
      update: {},
      create: journeyData,
    });
  }

  console.log(`✅ PatientJourney criado para ${patients.length} pacientes`);

  // Criar algumas mensagens de exemplo (usar upsert para evitar duplicatas)
  // Pegar um paciente em tratamento para criar mensagens de exemplo
  const treatmentPatient = patients.find((p) => p.currentStage === 'TREATMENT');
  if (treatmentPatient) {
    const message1 = await prisma.message.upsert({
      where: { whatsappMessageId: 'wamid.test001' },
      update: {},
      create: {
        tenantId: tenant.id,
        patientId: treatmentPatient.id,
        whatsappMessageId: 'wamid.test001',
        whatsappTimestamp: new Date('2024-12-10T10:00:00Z'),
        type: 'TEXT',
        direction: 'INBOUND',
        content: 'Olá, estou sentindo muita náusea hoje após a quimioterapia',
        processedBy: 'AGENT',
        criticalSymptomsDetected: [],
        alertTriggered: false,
      },
    });

    const message2 = await prisma.message.upsert({
      where: { whatsappMessageId: 'wamid.test002' },
      update: {},
      create: {
        tenantId: tenant.id,
        patientId: treatmentPatient.id,
        conversationId: message1.id,
        whatsappMessageId: 'wamid.test002',
        whatsappTimestamp: new Date('2024-12-10T10:05:00Z'),
        type: 'TEXT',
        direction: 'OUTBOUND',
        content:
          'Entendo que você está sentindo náusea. Em uma escala de 0 a 10, como você classificaria a intensidade?',
        processedBy: 'AGENT',
      },
    });

    console.log('✅ Mensagens de exemplo criadas:', 2);
  }

  // Criar alerta de exemplo (verificar se já existe)
  // Pegar um paciente em diagnóstico para criar alerta
  const diagnosisPatient = patients.find((p) => p.currentStage === 'DIAGNOSIS');
  if (diagnosisPatient) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: diagnosisPatient.id,
        type: 'CRITICAL_SYMPTOM',
      },
    });

    if (!existingAlert) {
      await prisma.alert.create({
        data: {
          tenantId: tenant.id,
          patientId: diagnosisPatient.id,
          type: 'CRITICAL_SYMPTOM',
          severity: 'CRITICAL',
          message: 'Paciente reportou febre acima de 38°C e falta de ar',
          context: {
            conversationId: 'conv_001',
            symptoms: ['febre', 'dispneia'],
            temperature: 38.5,
          },
          status: 'PENDING',
        },
      });
      console.log('✅ Alerta crítico criado');
    } else {
      console.log('✅ Alerta crítico já existe');
    }
  }

  // Criar diagnósticos de câncer com biomarcadores (para pacientes em tratamento e seguimento)
  const patientsWithDiagnosis = patients.filter(
    (p) => p.currentStage === 'TREATMENT' || p.currentStage === 'FOLLOW_UP'
  );

  for (const patient of patientsWithDiagnosis) {
    const isPalliative = patient.id === palliativePatient.id;
    const isTreatment = patient.currentStage === 'TREATMENT';

    // Biomarcadores por tipo de câncer
    const biomarkers: any = {};

    if (patient.cancerType === 'breast') {
      biomarkers.her2Status = 'positivo';
      biomarkers.erStatus = 'positivo';
      biomarkers.prStatus = 'positivo';
      biomarkers.ki67Percentage = 25;
    } else if (patient.cancerType === 'lung') {
      biomarkers.egfrMutation = 'mutado';
      biomarkers.alkRearrangement = 'negativo';
      biomarkers.pdl1Expression = 60;
    } else if (patient.cancerType === 'colorectal') {
      biomarkers.krasMutation = 'wild-type';
      biomarkers.brafMutation = 'wild-type';
      biomarkers.msiStatus = 'MSS';
    } else if (patient.cancerType === 'prostate') {
      biomarkers.psaBaseline = 15.5;
      biomarkers.gleasonScore = '3+4=7';
    }

    const existingDiagnosis = await prisma.cancerDiagnosis.findFirst({
      where: { tenantId: tenant.id, patientId: patient.id },
    });

    if (!existingDiagnosis) {
      await prisma.cancerDiagnosis.create({
        data: {
          tenantId: tenant.id,
          patientId: patient.id,
          cancerType: patient.name,
          diagnosisDate: isTreatment
            ? new Date('2024-02-01')
            : isPalliative
              ? new Date('2023-07-15')
              : new Date('2023-07-05'),
          diagnosisConfirmed: true,
          stage: isTreatment ? 'IIIA' : isPalliative ? 'IV' : 'II',
          tStage: isTreatment ? 'T3' : isPalliative ? 'T4' : 'T2',
          nStage: isTreatment ? 'N1' : isPalliative ? 'N2' : 'N0',
          mStage: isPalliative ? 'M1' : 'M0',
          grade: 'G2',
          ...biomarkers,
          isPrimary: true,
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Diagnósticos de câncer criados para ${patientsWithDiagnosis.length} pacientes`);

  // Criar tratamentos (para pacientes em tratamento ativo)
  const patientsInTreatment = patients.filter((p) => p.currentStage === 'TREATMENT');

  for (const patient of patientsInTreatment.slice(0, 3)) {
    // Apenas alguns para exemplo
    const diagnosis = await prisma.cancerDiagnosis.findFirst({
      where: { tenantId: tenant.id, patientId: patient.id },
    });

    if (diagnosis) {
      const existingTreatment = await prisma.treatment.findFirst({
        where: { tenantId: tenant.id, patientId: patient.id },
      });

      if (!existingTreatment) {
        await prisma.treatment.create({
          data: {
            tenantId: tenant.id,
            patientId: patient.id,
            diagnosisId: diagnosis.id,
            treatmentType: 'CHEMOTHERAPY',
            treatmentName: 'FOLFOX',
            protocol: 'Protocolo FOLFOX modificado',
            line: 1,
            intent: 'CURATIVE',
            startDate: new Date('2024-03-01'),
            plannedEndDate: new Date('2024-08-01'),
            currentCycle: 3,
            totalCycles: 8,
            cyclesCompleted: 2,
            status: 'ACTIVE',
            isActive: true,
            frequency: 'A cada 21 dias',
            administrationRoute: 'IV',
            medications: [
              { name: 'Oxaliplatina', dose: '85 mg/m²', route: 'IV' },
              { name: '5-Fluorouracil', dose: '400 mg/m²', route: 'IV' },
              { name: 'Leucovorin', dose: '400 mg/m²', route: 'IV' },
            ],
            toxicities: [
              {
                type: 'Neuropatia periférica',
                grade: 1,
                date: new Date('2024-04-01'),
              },
              { type: 'Náuseas', grade: 2, date: new Date('2024-03-15') },
            ],
            response: 'PARTIAL_RESPONSE',
            responseDate: new Date('2024-05-15'),
            responseNotes: 'Redução de 40% no tamanho do tumor',
          },
        });
      }
    }
  }

  console.log('✅ Tratamentos de exemplo criados para 3 pacientes');

  // Criar questionários padrão
  const questionnaireEORTC = await prisma.questionnaire.upsert({
    where: { code: 'EORTC-QLQ-C30' },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'EORTC-QLQ-C30',
      name: 'EORTC QLQ-C30',
      description: 'Questionário de Qualidade de Vida da EORTC',
      type: 'EORTC_QLQ_C30',
      isActive: true,
      structure: {
        version: '3.0',
        sections: [
          {
            id: 'physical',
            name: 'Função Física',
            questions: [
              {
                id: 'q1',
                text: 'Você tem dificuldade para fazer atividades pesadas?',
                type: 'scale',
                scale: { min: 1, max: 4 },
              },
            ],
          },
        ],
      },
    },
  });

  const questionnaireESAS = await prisma.questionnaire.upsert({
    where: { code: 'ESAS' },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'ESAS',
      name: 'ESAS (Edmonton Symptom Assessment System)',
      description: 'Escala de Avaliação de Sintomas de Edmonton',
      type: 'ESAS',
      isActive: true,
      structure: {
        version: '1.0',
        questions: [
          { id: 'pain', text: 'Dor', scale: { min: 0, max: 10 } },
          { id: 'tiredness', text: 'Cansaço', scale: { min: 0, max: 10 } },
          { id: 'nausea', text: 'Náusea', scale: { min: 0, max: 10 } },
        ],
      },
    },
  });

  console.log('✅ Questionários padrão criados:', 2);

  // Criar respostas a questionários (para paciente em tratamento)
  if (treatmentPatient) {
    const existingResponse = await prisma.questionnaireResponse.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: treatmentPatient.id,
        questionnaireId: questionnaireESAS.id,
      },
    });

    if (!existingResponse) {
      await prisma.questionnaireResponse.create({
        data: {
          tenantId: tenant.id,
          patientId: treatmentPatient.id,
          questionnaireId: questionnaireESAS.id,
          responses: {
            pain: 6,
            tiredness: 7,
            nausea: 8,
          },
          completedAt: new Date('2024-12-10T10:00:00Z'),
          appliedBy: 'AGENT',
        },
      });
      console.log('✅ Resposta a questionário ESAS criada');
    } else {
      console.log('✅ Resposta a questionário ESAS já existe');
    }
  }

  // Criar observações clínicas (FHIR)
  if (treatmentPatient) {
    const existingObservation = await prisma.observation.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: treatmentPatient.id,
        code: '72514-3',
      },
    });

    if (!existingObservation) {
      await prisma.observation.create({
        data: {
          tenantId: tenant.id,
          patientId: treatmentPatient.id,
          code: '72514-3',
          display: 'Pain severity',
          valueQuantity: 7,
          unit: 'score',
          effectiveDateTime: new Date('2024-12-10T10:00:00Z'),
          status: 'final',
          syncedToEHR: false,
        },
      });
      console.log('✅ Observação clínica (Pain severity) criada');
    } else {
      console.log('✅ Observação clínica já existe');
    }
  }

  // Criar notas internas
  if (diagnosisPatient) {
    const existingNote = await prisma.internalNote.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: diagnosisPatient.id,
      },
    });

    if (!existingNote) {
      await prisma.internalNote.create({
        data: {
          tenantId: tenant.id,
          patientId: diagnosisPatient.id,
          authorId: nurse.id,
          content:
            'Paciente aguardando resultado de biópsia. Família demonstrou ansiedade. Solicitei suporte psicológico.',
        },
      });
      console.log('✅ Nota interna criada');
    } else {
      console.log('✅ Nota interna já existe');
    }
  }

  // Criar etapas de navegação oncológica (para paciente em diagnóstico)
  if (diagnosisPatient) {
    const existingSteps = await prisma.navigationStep.findMany({
      where: {
        tenantId: tenant.id,
        patientId: diagnosisPatient.id,
      },
    });

    if (existingSteps.length === 0) {
      await prisma.navigationStep.createMany({
        data: [
          {
            tenantId: tenant.id,
            patientId: diagnosisPatient.id,
            cancerType: 'colorectal',
            journeyStage: 'DIAGNOSIS',
            stepKey: 'colonoscopy',
            stepName: 'Colonoscopia',
            stepDescription: 'Colonoscopia com biópsia',
            status: 'COMPLETED',
            isRequired: true,
            isCompleted: true,
            completedAt: new Date('2024-11-20'),
            expectedDate: new Date('2024-11-15'),
            actualDate: new Date('2024-11-20'),
            result: 'Lesão identificada',
            findings: ['Lesão de 3cm em sigmóide', 'Biópsia realizada'],
          },
          {
            tenantId: tenant.id,
            patientId: diagnosisPatient.id,
            cancerType: 'colorectal',
            journeyStage: 'DIAGNOSIS',
            stepKey: 'pathology',
            stepName: 'Resultado de Anatomopatológico',
            stepDescription: 'Laudo de anatomopatológico',
            status: 'IN_PROGRESS',
            isRequired: true,
            isCompleted: false,
            expectedDate: new Date('2024-12-05'),
            dueDate: new Date('2024-12-10'),
          },
          {
            tenantId: tenant.id,
            patientId: diagnosisPatient.id,
            cancerType: 'colorectal',
            journeyStage: 'DIAGNOSIS',
            stepKey: 'ct_abdomen',
            stepName: 'TC de Abdome e Pelve',
            stepDescription: 'Tomografia para estadiamento',
            status: 'PENDING',
            isRequired: true,
            isCompleted: false,
            expectedDate: new Date('2024-12-15'),
            dueDate: new Date('2024-12-20'),
          },
        ],
      });
      console.log('✅ Etapas de navegação criadas para paciente em diagnóstico:', 3);
    } else {
      console.log(`✅ Etapas de navegação já existem: ${existingSteps.length}`);
    }
  }

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📋 Credenciais de teste:');
  console.log('  📧 Admin:');
  console.log('    Email: admin@hospitalteste.com');
  console.log('    Senha: senha123');
  console.log('');
  console.log('  👨‍⚕️ Oncologista:');
  console.log('    Email: oncologista@hospitalteste.com');
  console.log('    Senha: senha123');
  console.log('');
  console.log('  👩‍⚕️ Enfermeira:');
  console.log('    Email: enfermeira@hospitalteste.com');
  console.log('    Senha: senha123');
  console.log('');
  console.log('  👔 Coordenador:');
  console.log('    Email: coordenador@hospitalteste.com');
  console.log('    Senha: senha123');
  console.log('');
  console.log('📊 Dados criados:');
  console.log(`  - ${patients.length} pacientes`);
  console.log(`  - ${patients.length} jornadas de paciente`);
  console.log(`  - ${patientsWithDiagnosis.length} diagnósticos de câncer`);
  console.log('  - 3 tratamentos ativos');
  console.log('  - 2 questionários (EORTC, ESAS)');
  console.log('  - 1 resposta a questionário');
  console.log('  - 1 observação clínica (FHIR)');
  console.log('  - 1 nota interna');
  console.log('  - 3 etapas de navegação');
  console.log('  - 2 mensagens de exemplo');
  console.log('  - 1 alerta crítico');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
