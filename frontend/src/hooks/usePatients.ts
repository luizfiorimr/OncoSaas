import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, Patient, CreatePatientDto, UpdatePatientDto } from '@/lib/api/patients';

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const usePatient = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.getById(id),
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientDto) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientDto }) =>
      patientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

