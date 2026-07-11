import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';
import { UserRepository } from './interfaces/user.repository';
import { PasswordService } from './services/password.service';
import { JwtTokenService } from './services/jwt.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { OrganizationRepository } from '../organization/interfaces/oeganization.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtTokenService,
    private readonly passwordService: PasswordService,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async signUp(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const organization = await this.organizationRepository.findOrganizationById(
      dto.organizationId,
    );

    if (!organization) {
      throw new BadRequestException(
        'The selected organization does not exist.',
      );
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      organizationId: dto.organizationId,
    });

    return user;
  }

  async signIn(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isValid = await this.passwordService.compare(
      dto.password,
      user.password,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAccessToken(payload);

    const refreshToken = await this.jwtService.signRefreshToken(payload);

    // store refresh token in DB
    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: safeUser,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      const newAccessToken = await this.jwtService.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
