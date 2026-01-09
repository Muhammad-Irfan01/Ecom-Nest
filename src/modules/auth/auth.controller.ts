import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signin')
  async signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @Post('activate-account')
  async activateAccount(@Body() activateAccountDto: ActivateAccountDto) {
    return this.authService.activateAccountWithCode(activateAccountDto);
  }

  @Post('activate-account-by-admin')
  @UseGuards(JwtAuthGuard)
  async activateAccountByAdmin(
    @Body('userId') userId: number,
    @Request() req
  ) {
    const adminId = req.user.sub;
    return this.authService.activateAccountByAdmin(userId, adminId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('pending-activations')
  @UseGuards(JwtAuthGuard)
  async getPendingActivations(@Request() req) {
    const adminId = req.user.sub;
    return this.authService.getPendingActivations(adminId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const userId = req.user.sub;
    return this.authService.getProfile(userId);
  }

  @Get('role')
  @UseGuards(JwtAuthGuard)
  async getUserRole(@Request() req) {
    const userId = req.user.sub;
    return this.authService.getUserRole(userId);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    // Remove the refresh token from the database to invalidate it
    await this.authService.removeRefreshToken(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
