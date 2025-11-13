import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { MessagesModule } from './messages/messages.module';
import { AlertsModule } from './alerts/alerts.module';
import { ObservationsModule } from './observations/observations.module';
import { GatewaysModule } from './gateways/gateways.module';
import { OncologyNavigationModule } from './oncology-navigation/oncology-navigation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env', // Caminho relativo ao backend/src
      expandVariables: true,
    }),
    ScheduleModule.forRoot(), // Habilita agendamento de tarefas
    PrismaModule,
    AuthModule,
    PatientsModule,
    MessagesModule,
    AlertsModule,
    ObservationsModule,
    GatewaysModule,
    OncologyNavigationModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
