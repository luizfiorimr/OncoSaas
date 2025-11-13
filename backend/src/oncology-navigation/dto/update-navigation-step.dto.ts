import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { NavigationStepStatus } from '@prisma/client';

export class UpdateNavigationStepDto {
  @IsEnum(NavigationStepStatus)
  @IsOptional()
  status?: NavigationStepStatus;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  completedBy?: string;

  @IsDateString()
  @IsOptional()
  actualDate?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  notes?: string;
}

