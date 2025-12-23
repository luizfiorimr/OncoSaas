import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  findAll(
    @CurrentUser() user: any,
    @Query('patientId') patientId?: string,
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

    return this.messagesService.findAll(
      user.tenantId,
      patientId,
      {
        limit: parsedLimit,
        offset: parsedOffset,
      }
    );
  }

  @Get('unassumed/count')
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  getUnassumedCount(@CurrentUser() user: any) {
    return this.messagesService.getUnassumedCount(user.tenantId);
  }

  @Get('conversation/:patientId')
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  getConversation(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: string
  ) {
    // Validar e converter limit com fallback seguro
    let parsedLimit = 50; // Default
    if (limit) {
      const parsed = parseInt(limit, 10);
      parsedLimit = !isNaN(parsed) && parsed > 0 ? Math.min(parsed, 500) : 50;
    }

    return this.messagesService.getConversation(
      patientId,
      user.tenantId,
      parsedLimit
    );
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.messagesService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINATOR,
    UserRole.NURSE,
    UserRole.ONCOLOGIST
  ) // Permite enfermeiros e oncologistas enviarem mensagens quando assumem conversa
  create(@Body() createMessageDto: CreateMessageDto, @CurrentUser() user: any) {
    // Se processedBy é NURSING, adicionar assumedBy automaticamente
    if (
      createMessageDto.processedBy === 'NURSING' &&
      !createMessageDto.assumedBy
    ) {
      createMessageDto.assumedBy = user.id;
    }
    return this.messagesService.create(createMessageDto, user.tenantId);
  }

  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: any
  ) {
    return this.messagesService.update(id, updateMessageDto, user.tenantId);
  }

  @Patch(':id/assume')
  @Roles(
    UserRole.ADMIN,
    UserRole.ONCOLOGIST,
    UserRole.NURSE,
    UserRole.COORDINATOR
  )
  assumeConversation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.messagesService.assumeConversation(id, user.tenantId, user.id);
  }
}
