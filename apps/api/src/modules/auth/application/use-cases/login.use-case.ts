import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { UserRepository } from '../../domain/interfaces/user.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtTokenService } from '../../infrastructure/services/jwt.service';
import { LoginDto } from '../../presentation/dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtTokenService,
  ) {}

  async execute(dto: LoginDto) {
    const user =
      await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    const isValid =
      await this.passwordService.compare(
        dto.password,
        user.password,
      );

    if (!isValid) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
};

const accessToken =
  await this.jwtService.signAccessToken(payload);

const refreshToken =
  await this.jwtService.signRefreshToken(payload);

// store refresh token in DB
await this.userRepository.updateRefreshToken(
  user.id,
  refreshToken,
);

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
  }