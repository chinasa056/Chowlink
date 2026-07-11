import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';

import { UserRepository } from './interfaces/user.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { OrganizationRepository } from '../organization/interfaces/oeganization.repository';
import { PrismaOrganizationRepository } from '../organization/repositories/prisma.organization.repository';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,

    PasswordService,
    JwtTokenService,

    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },

    {
      provide: OrganizationRepository,
      useClass: PrismaOrganizationRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
