import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oncologyNavigationApi } from '@/lib/api/oncology-navigation';

export const usePatientNavigationSteps = (patientId: string | null) => {
  return useQuery({
    queryKey: ['navigation-steps', patientId],
    queryFn: () => oncologyNavigationApi.getPatientSteps(patientId!),
    enabled: !!patientId,
    staleTime: 30 * 1000, // 30 segundos
  });
};

export const useStepsByStage = (
  patientId: string | null,
  journeyStage:
    | 'SCREENING'
    | 'NAVIGATION'
    | 'DIAGNOSIS'
    | 'TREATMENT'
    | 'FOLLOW_UP'
    | null
) => {
  return useQuery({
    queryKey: ['navigation-steps', patientId, journeyStage],
    queryFn: () =>
      oncologyNavigationApi.getStepsByStage(patientId!, journeyStage!),
    enabled: !!patientId && !!journeyStage,
    staleTime: 30 * 1000,
  });
};

export const useInitializeNavigationSteps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patientId,
      cancerType,
      currentStage,
    }: {
      patientId: string;
      cancerType: string;
      currentStage:
        | 'SCREENING'
        | 'NAVIGATION'
        | 'DIAGNOSIS'
        | 'TREATMENT'
        | 'FOLLOW_UP';
    }) =>
      oncologyNavigationApi.initializeSteps(
        patientId,
        cancerType,
        currentStage
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['navigation-steps', variables.patientId],
      });
    },
  });
};

export const useUpdateNavigationStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      data,
    }: {
      stepId: string;
      data: Parameters<typeof oncologyNavigationApi.updateStep>[1];
    }) => oncologyNavigationApi.updateStep(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['navigation-steps'],
      });
    },
  });
};

export const useInitializeAllPatients = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => oncologyNavigationApi.initializeAllPatients(),
    onSuccess: (result) => {
      // Invalidar todas as queries de pacientes e etapas
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-steps'] });
      return result;
    },
  });
};

export const useUploadStepFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepId, file }: { stepId: string; file: File }) =>
      oncologyNavigationApi.uploadFile(stepId, file),
    onSuccess: (_, variables) => {
      // Invalidar etapas do paciente
      queryClient.invalidateQueries({ queryKey: ['navigation-steps'] });
    },
  });
};
