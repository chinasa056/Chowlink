import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './presentation/controllers/auth.controller';

import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';

import { PasswordService } from './infrastructure/services/password.service';
import { JwtTokenService } from './infrastructure/services/jwt.service';

import { UserRepository } from './domain/interfaces/user.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

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
    RegisterUseCase,
    JwtStrategy,
    LoginUseCase,

    PasswordService,
    JwtTokenService,

    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class AuthModule {}