import { BadRequestException, Injectable } from '@nestjs/common';

import { UserRole } from '@prisma/client';

import { UserRepository } from '../../domain/interfaces/user.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { RegisterDto } from '../../presentation/dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('User already exists');
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
}
