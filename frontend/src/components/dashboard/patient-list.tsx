'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  cancerType: string;
  stage: string;
  priorityScore: number;
  priorityCategory: 'critico' | 'alto' | 'medio' | 'baixo';
  lastInteraction?: string;
  alertCount: number;
}

interface PatientListProps {
  patients: Patient[];
  onPatientClick: (patientId: string) => void;
  onTakeOver: (patientId: string) => void;
  selectedPatientId?: string | null;
  hideActionButtons?: boolean; // Nova prop para esconder botões de ação
}

export function PatientList({
  patients,
  onPatientClick,
  onTakeOver,
  selectedPatientId,
  hideActionButtons = false,
}: PatientListProps) {
  // Refs para cada card de paciente (para scroll automático)
  const patientRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll automático quando paciente é selecionado externamente
  useEffect(() => {
    if (selectedPatientId && patientRefs.current[selectedPatientId]) {
      // Pequeno delay para garantir que o DOM foi atualizado
      const timeoutId = setTimeout(() => {
        patientRefs.current[selectedPatientId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // Não força scroll completo, apenas o necessário
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedPatientId]);

  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'critico':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'alto':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'medio':
        return 'border-l-4 border-l-green-500 bg-green-50';
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (category: string) => {
    switch (category) {
      case 'critico':
        return '🔴';
      case 'alto':
        return '🟡';
      case 'medio':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <div
          key={patient.id}
          ref={(el) => {
            patientRefs.current[patient.id] = el;
          }}
          className={`p-4 rounded-lg border ${getPriorityColor(patient.priorityCategory)} cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${
            selectedPatientId === patient.id
              ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg'
              : ''
          }`}
          onClick={() => onPatientClick(patient.id)}
        >
          <div className="flex flex-col gap-3">
            {/* Header com nome e informações básicas */}
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">
                {getPriorityIcon(patient.priorityCategory)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg truncate">
                    {patient.name}
                  </h3>
                  {patient.alertCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-300">
                      <AlertTriangle className="h-3 w-3" />
                      {patient.alertCount}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {patient.cancerType} - {patient.stage}
                </span>
              </div>
            </div>

            {/* Informações de score */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Score: {patient.priorityScore}/100 (
                {patient.priorityCategory.toUpperCase()})
              </span>
              {patient.lastInteraction && (
                <span className="hidden sm:inline">
                  Última interação: {patient.lastInteraction}
                </span>
              )}
            </div>

            {/* Botões de ação */}
            {!hideActionButtons && (
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPatientClick(patient.id);
                  }}
                >
                  Ver Conversa
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeOver(patient.id);
                  }}
                >
                  Assumir
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
