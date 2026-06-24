import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwt: JwtService) {}

  async signAccessToken(payload: any) {
    return this.jwt.signAsync(payload, {
      expiresIn: '15m',
    });
  }

  async signRefreshToken(payload: any) {
    return this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });
  }

  async verifyRefreshToken(token: string) {
    return this.jwt.verifyAsync(token);
  }
}