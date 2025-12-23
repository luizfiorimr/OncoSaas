import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Controller('observations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createObservationDto: CreateObservationDto,
    @Request() req
  ) {
    return this.observationsService.create(
      createObservationDto,
      req.user.tenantId
    );
  }

  @Get()
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('code') code?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    // Validar e converter limit/offset com fallback seguro
    let parsedLimit: number | undefined;
    if (limit) {
      const parsed = parseInt(limit, 10);
      parsedLimit = !isNaN(parsed) && parsed > 0 ? parsed : undefined;
    }
    
    let parsedOffset: number | undefined;
    if (offset) {
      const parsed = parseInt(offset, 10);
      parsedOffset = !isNaN(parsed) && parsed >= 0 ? parsed : undefined;
    }

    return this.observationsService.findAll(
      req.user.tenantId,
      patientId,
      code,
      {
        limit: parsedLimit,
        offset: parsedOffset,
      }
    );
  }

  @Get('unsynced')
  findUnsynced(@Request() req) {
    return this.observationsService.findUnsynced(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.observationsService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateObservationDto: UpdateObservationDto,
    @Request() req
  ) {
    return this.observationsService.update(
      id,
      updateObservationDto,
      req.user.tenantId
    );
  }

  @Patch(':id/sync')
  @HttpCode(HttpStatus.OK)
  markAsSynced(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('fhirResourceId') fhirResourceId: string,
    @Request() req
  ) {
    return this.observationsService.markAsSynced(
      id,
      req.user.tenantId,
      fhirResourceId
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.observationsService.remove(id, req.user.tenantId);
  }
}

