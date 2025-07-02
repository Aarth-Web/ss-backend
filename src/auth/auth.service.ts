import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../user/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { generateRegistrationId } from './utils/generate-reg-id';
import { OnboardUserDto } from './dto/onboard.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { UserRole } from '../user/user-role.enum';
import { ParentLanguage } from '../user/parent-language.enum';
import { School } from '../school/school.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(School.name) private schoolModel: Model<School>,
    private jwtService: JwtService,
  ) {}

  async onboardUser(dto: OnboardUserDto, creator: any) {
    const defaultPassword = 'Pass@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const regId = generateRegistrationId();

    // Superadmin onboarding without token
    if (dto.role === UserRole.SUPERADMIN) {
      if (!dto.secret || dto.secret !== process.env.SUPERADMIN_SECRET) {
        throw new ForbiddenException('Invalid or missing superadmin secret');
      }
      const exists = await this.userModel.findOne({
        role: UserRole.SUPERADMIN,
      });
      if (exists) throw new ForbiddenException('Superadmin already exists');
    } else {
      if (!creator || !creator.role) {
        throw new UnauthorizedException('Authentication required');
      }

      const permissionMatrix = {
        [UserRole.SUPERADMIN]: [
          UserRole.SCHOOLADMIN,
          UserRole.TEACHER,
          UserRole.STUDENT,
        ],
        [UserRole.SCHOOLADMIN]: [UserRole.TEACHER, UserRole.STUDENT],
        [UserRole.TEACHER]: [UserRole.STUDENT],
      };

      const allowedRoles = permissionMatrix[creator.role] || [];
      if (!allowedRoles.includes(dto.role)) {
        throw new ForbiddenException(
          `Role ${creator.role} not allowed to create ${dto.role}`,
        );
      }
    }

    const userData = {
      name: dto.name,
      password: hashedPassword,
      role: dto.role,
      registrationId: regId,
      school: dto.schoolId || null,
    };

    // Add fields if provided
    if (dto.email) {
      userData['email'] = dto.email;
    }

    if (dto.mobile) {
      userData['mobile'] = dto.mobile;
    }

    // Add student-specific fields if this is a student and the fields are provided
    if (dto.role === UserRole.STUDENT) {
      // Create additionalInfo object if it doesn't exist
      if (!userData['additionalInfo']) {
        userData['additionalInfo'] = {};
      }

      // Add parent language if provided
      if (dto.parentLanguage) {
        userData['additionalInfo'].parentLanguage = dto.parentLanguage;
      }

      // Add parent occupation if provided
      if (dto.parentOccupation) {
        userData['additionalInfo'].parentOccupation = dto.parentOccupation;
      }
    }

    // Add any additional info if provided
    if (dto.additionalInfo) {
      userData['additionalInfo'] = {
        ...userData['additionalInfo'], // Keep student specific fields if added above
        ...dto.additionalInfo,
      };
    }

    const user = new this.userModel(userData);
    const saved = await user.save();

    return {
      message: `${dto.role} onboarded successfully`,
      registrationId: saved.registrationId,
      defaultPassword,
    };
  }

  async login({ registrationId, password }) {
    const user = await this.userModel.findOne({ registrationId });
    if (!user) throw new UnauthorizedException('Invalid registrationId');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Incorrect password');

    const payload = { userId: user._id, role: user.role };

    // Convert to plain object and exclude password
    const userObject = user.toJSON();
    const { password: _, ...userWithoutPassword } = userObject;

    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async resetPassword(dto: ResetPasswordDto, currentUser: User) {
    // Get the authenticated user
    const user = await this.userModel.findById(currentUser._id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify the current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update the password
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async adminResetPassword(dto: AdminResetPasswordDto, currentUser: User) {
    // Check if the current user has admin privileges
    if (
      currentUser.role !== UserRole.SUPERADMIN &&
      currentUser.role !== UserRole.SCHOOLADMIN
    ) {
      throw new ForbiddenException(
        'Only administrators can reset other users passwords',
      );
    }

    // Find the user whose password needs to be reset
    const user = await this.userModel.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // School admins can only reset passwords for users in their school
    if (
      currentUser.role === UserRole.SCHOOLADMIN &&
      user.school?.toString() !== currentUser.school?.toString()
    ) {
      throw new ForbiddenException(
        'You can only reset passwords for users in your school',
      );
    }

    // Update the password
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully by administrator' };
  }
}
