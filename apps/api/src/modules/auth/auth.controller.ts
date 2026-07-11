import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
   private readonly authService: AuthService
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.signUp(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.signIn(dto);
  }
  @Post('refresh')
refresh(@Body() dto: RefreshDto) {
  return this.authService.refreshToken(dto.refreshToken);
}

@Get('me')
@UseGuards(JwtAuthGuard)
me(@CurrentUser() user: any) {
  return user;
}
}