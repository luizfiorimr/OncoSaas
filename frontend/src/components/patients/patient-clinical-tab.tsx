'use client';

import { PatientDetail, Comorbidity, FamilyHistory } from '@/lib/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PatientClinicalTabProps {
  patient: PatientDetail;
}

const SEVERITY_LABELS: Record<string, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  grave: 'Grave',
};

const SEVERITY_COLORS: Record<string, string> = {
  leve: 'bg-green-100 text-green-800 border-green-300',
  moderada: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  grave: 'bg-red-100 text-red-800 border-red-300',
};

function getECOGDescription(score: number): string {
  if (score === 0) return 'Assintomático';
  if (score === 1) return 'Sintomático, mas ambulatorial';
  if (score === 2) return 'Acamado <50% do tempo';
  if (score === 3) return 'Acamado >50% do tempo';
  if (score === 4) return 'Totalmente acamado';
  return '';
}

export function PatientClinicalTab({
  patient,
}: PatientClinicalTabProps): JSX.Element {
  const comorbidities: Comorbidity[] = Array.isArray(patient.comorbidities)
    ? patient.comorbidities
    : [];

  const familyHistory: FamilyHistory[] = Array.isArray(patient.familyHistory)
    ? patient.familyHistory
    : [];

  return (
    <div className="space-y-6">
      {/* Performance Status (ECOG) */}
      {patient.performanceStatus !== null &&
        patient.performanceStatus !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    ECOG
                  </span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {patient.performanceStatus}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getECOGDescription(patient.performanceStatus as number)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Comorbidades */}
      <Card>
        <CardHeader>
          <CardTitle>Comorbidades</CardTitle>
        </CardHeader>
        <CardContent>
          {comorbidities.length > 0 ? (
            <div className="space-y-3">
              {comorbidities.map((comorbidity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{comorbidity.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Severidade:{' '}
                      {SEVERITY_LABELS[comorbidity.severity] ||
                        comorbidity.severity}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={SEVERITY_COLORS[comorbidity.severity] || ''}
                    >
                      {SEVERITY_LABELS[comorbidity.severity] ||
                        comorbidity.severity}
                    </Badge>
                    {comorbidity.controlled ? (
                      <Badge variant="default" className="bg-green-600">
                        Controlada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Não controlada</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma comorbidade registrada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fatores de Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Fatores de Risco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabagismo */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tabagismo
            </label>
            <p className="text-lg mt-1">
              {patient.smokingHistory || 'Não informado'}
            </p>
          </div>

          <Separator />

          {/* Etilismo */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Etilismo
            </label>
            <p className="text-lg mt-1">
              {patient.alcoholHistory || 'Não informado'}
            </p>
          </div>

          <Separator />

          {/* Exposição Ocupacional */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Exposição Ocupacional
            </label>
            <p className="text-lg mt-1">
              {patient.occupationalExposure || 'Não informado'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* História Familiar */}
      <Card>
        <CardHeader>
          <CardTitle>História Familiar de Câncer</CardTitle>
        </CardHeader>
        <CardContent>
          {familyHistory.length > 0 ? (
            <div className="space-y-3">
              {familyHistory.map((member, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {member.relationship || 'Familiar'}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Tipo de Câncer:</span>{' '}
                        {member.cancerType}
                      </div>
                      {member.ageAtDiagnosis && (
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">
                            Idade no Diagnóstico:
                          </span>{' '}
                          {member.ageAtDiagnosis} anos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum histórico familiar de câncer registrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
