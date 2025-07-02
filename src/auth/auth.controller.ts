import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OnboardUserDto } from './dto/onboard.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('onboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  onboard(@Body() dto: OnboardUserDto, @Req() req) {
    return this.authService.onboardUser(dto, req.user);
  }

  @Post('onboard-superadmin')
  onboardSuperadmin(@Body() dto: OnboardUserDto) {
    return this.authService.onboardUser(dto, null);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req) {
    return this.authService.resetPassword(dto, req.user);
  }

  @Post('admin-reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  adminResetPassword(@Body() dto: AdminResetPasswordDto, @Req() req) {
    return this.authService.adminResetPassword(dto, req.user);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  verifyToken(@Req() req) {
    return { user: req.user };
  }
}
