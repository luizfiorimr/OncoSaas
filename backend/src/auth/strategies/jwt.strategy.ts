import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // Usar findFirst com tenantId para garantir isolamento multi-tenant
    // Mesmo que id seja único, incluir tenantId adiciona camada extra de segurança
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId, // Verificar tenantId do token
      },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar se tenantId do token corresponde ao do usuário
    if (user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Invalid tenant');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tenant: user.tenant,
    };
  }
}
