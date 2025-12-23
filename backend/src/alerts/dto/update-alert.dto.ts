import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertDto } from './create-alert.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AlertStatus } from '@prisma/client';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsUUID()
  @IsOptional()
  acknowledgedBy?: string; // ID do usuário que reconheceu

  @IsUUID()
  @IsOptional()
  resolvedBy?: string; // ID do usuário que resolveu
}
