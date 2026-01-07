import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService, private mailService: MailService) { }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.users.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exist');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        password: hashed,
        phone: dto.phone || '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create activation record - user needs admin approval
    const activationCode = generateSixDigitCode();
    const activationRecord = await this.prisma.activations.create({
      data: {
        user_id: user.id,
        code: activationCode,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Send activation code to user (for reference, not for user activation)
    await this.mailService.sendActivationCode(dto.email, activationCode);

    return {
      message: "User created successfully. Account pending admin approval",
      activationCode,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      activationRecord
    };
  }

  // Admin-only method to activate user account
  async activateAccountByAdmin(userId: number, adminId: number) {
    // Verify that the requesting user is an admin
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin') ||
      ur.roles.role_translations?.some(rt => rt.name?.toLowerCase().includes('admin'))
    );

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can activate accounts');
    }

    // Find the activation record for the user
    const activation = await this.prisma.activations.findFirst({
      where: { user_id: userId, completed: false },
    });

    if (!activation) {
      throw new BadRequestException('No pending activation found for this user');
    }

    // Update the activation as completed
    const updatedActivation = await this.prisma.activations.update({
      where: { id: activation.id },
      data: {
        completed: true,
        completed_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Optionally, send notification to user about account activation
    const user = await this.prisma.users.findUnique({
      where: { id: userId }
    });

    if (user) {
      await this.mailService.sendAccountActivatedNotification(user.email);
    }

    return {
      message: 'Account activated successfully',
      user: {
        id: userId,
      }
    };
  }

  // Alternative method: Allow activation with code (for initial setup or special cases)
  async activateAccountWithCode(dto: ActivateAccountDto) {
    const activation = await this.prisma.activations.findFirst({
      where: { code: dto.code, completed: false },
    });

    if (!activation) throw new BadRequestException('Invalid or expired activation code');

    const updatedActivation = await this.prisma.activations.update({
      where: { id: activation.id },
      data: {
        completed: true,
        completed_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { message: 'Account activated successfully' };
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.users.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid email');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new BadRequestException('Incorrect Password');

    // Check if account is activated
    const activation = await this.prisma.activations.findFirst({
      where: { user_id: user.id },
    });

    if (activation && !activation.completed) {
      throw new UnauthorizedException('Account not activated. Please contact admin for activation');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    }
  }

  async forgetPassword(dto: ForgetPasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('Invalid Email');

    const code = generateSixDigitCode();

    // Create a reminder record for password reset
    await this.prisma.reminders.create({
      data: {
        user_id: user.id,
        code,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await this.mailService.sendPasswordResetCode(dto.email, code);
    return { message: 'Password reset code sent successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reminder = await this.prisma.reminders.findFirst({
      where: { code: dto.code, completed: false }
    });

    if (!reminder) throw new BadRequestException('Invalid or expired reset code');

    const hashed = await bcrypt.hash(dto.password, 10);

    // Update user password
    await this.prisma.users.update({
      where: { id: reminder.user_id },
      data: {
        password: hashed,
        updated_at: new Date()
      },
    });

    // Mark the reminder as completed
    await this.prisma.reminders.update({
      where: { id: reminder.id },
      data: {
        completed: true,
        completed_at: new Date(),
        updated_at: new Date(),
      }
    });

    return { message: 'Password updated successfully' };
  }

  async getProfile(userId : number) {
    const user = await this.prisma.users.findUnique({
      where : {id : userId},
      select: {
        id: true,
        email : true,
        first_name : true,
        last_name : true,
        phone : true,
        created_at : true,
      },
    });

    if(!user) throw new NotFoundException('User not exist');

    return user;
  }

  async getUserRole(userId: number) {
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
      include: {
        roles: {
          include: { role_translations: { where: { locale: 'en' } } },
        },
      },
    });
    return roles.map(ur => ({
      id: ur.roles.id,
      name: ur.roles.role_translations[0]?.name || 'Unknown',
    }));
  }

  // Method to check if user is admin
  async isAdmin(userId: number): Promise<boolean> {
    const userRoles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
      include: {
        roles: true
      }
    });

    return userRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin') ||
      ur.roles.role_translations?.some(rt => rt.name?.toLowerCase().includes('admin'))
    );
  }

  // Method to get all pending activations (for admin use)
  async getPendingActivations(adminId: number) {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view pending activations');
    }

    const pendingActivations = await this.prisma.activations.findMany({
      where: { completed: false },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            created_at: true,
          }
        }
      }
    });

    return pendingActivations.map(activation => ({
      id: activation.id,
      userId: activation.user_id,
      userEmail: activation.users.email,
      userFirstName: activation.users.first_name,
      userLastName: activation.users.last_name,
      createdAt: activation.created_at,
    }));
  }
}

export const generateSixDigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
