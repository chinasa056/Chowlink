import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user.repository';
import { JwtTokenService } from '../../infrastructure/services/jwt.service';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwt: JwtTokenService,
  ) {}

  async execute(refreshToken: string) {
    try {
      const payload =
        await this.jwt.verifyRefreshToken(refreshToken);

      const user =
        await this.userRepository.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      const newAccessToken =
        await this.jwt.signAccessToken({
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