import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
  Delete,
  Body,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAllUsers(
    @Query('role') role: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.getAllUsers(role, page, limit);
  }

  @Get('school/:schoolId')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  getUsersBySchoolId(
    @Param('schoolId') schoolId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
    @Query('search') search?: string,
  ) {
    // If TEACHER, verify they belong to this school and return only students
    if (req.user.role === UserRole.TEACHER) {
      if (!req.user.school || req.user.school.toString() !== schoolId) {
        throw new ForbiddenException(
          'You can only view users from your own school',
        );
      }
      return this.userService.getStudentsBySchoolId(
        schoolId,
        Number(page),
        Number(limit),
        search,
      );
    }

    // For SUPERADMIN and SCHOOLADMIN
    return this.userService.getUsersBySchoolId(
      schoolId,
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  async getUserById(@Param('id') id: string, @Req() req) {
    const userRole = req.user.role;

    // SUPERADMIN can access any user
    if (userRole === UserRole.SUPERADMIN) {
      return this.userService.getUserById(id);
    }

    // Get the requested user to check permissions
    const requestedUser = await this.userService.getUserById(id);
    if (!requestedUser) throw new ForbiddenException('User not found');

    // SCHOOLADMIN can only access users in their school
    if (userRole === UserRole.SCHOOLADMIN) {
      // Check if the requested user belongs to the schooladmin's school
      if (
        !requestedUser.school ||
        requestedUser.school.toString() !== req.user.school?.toString()
      ) {
        throw new ForbiddenException('You can only view users in your school');
      }

      return requestedUser;
    }

    // TEACHER can only access STUDENT details in their school
    if (userRole === UserRole.TEACHER) {
      // Check if the requested user is a STUDENT
      if (requestedUser.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Teachers can only view student details');
      }

      // Check if the requested user belongs to the teacher's school
      if (
        !requestedUser.school ||
        requestedUser.school.toString() !== req.user.school?.toString()
      ) {
        throw new ForbiddenException(
          'You can only view students in your school',
        );
      }

      return requestedUser;
    }
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    // Don't allow users to update themselves through this endpoint
    if (req.user.userId === id)
      throw new ForbiddenException("You can't update yourself");

    const userToUpdate = await this.userService.getUserById(id);
    if (!userToUpdate) throw new ForbiddenException('User not found');

    // Define which fields each role can update
    let allowedFields: string[] = [];
    const userRole = req.user.role;

    // SUPERADMIN can update everything except _id, registrationId and password
    if (userRole === UserRole.SUPERADMIN) {
      allowedFields = [
        'name',
        'role',
        'school',
        'isActive',
        'email',
        'mobile',
        'additionalInfo',
      ];
    }
    // SCHOOLADMIN can update users in their school
    else if (userRole === UserRole.SCHOOLADMIN) {
      // Check if the user belongs to the schooladmin's school
      if (
        !userToUpdate.school ||
        userToUpdate.school.toString() !== req.user.school?.toString()
      ) {
        throw new ForbiddenException(
          'You can only update users in your school',
        );
      }

      // Can't update users with higher privileges
      if (
        userToUpdate.role === UserRole.SUPERADMIN ||
        userToUpdate.role === UserRole.SCHOOLADMIN
      ) {
        throw new ForbiddenException(
          'You cannot update users with higher privileges',
        );
      }

      allowedFields = [
        'name',
        'isActive',
        'email',
        'mobile',
        'additionalInfo',
        'parentLanguage',
        'parentOccupation',
      ];
    }
    // TEACHER can only update STUDENT details
    else if (userRole === UserRole.TEACHER) {
      // Check if the user belongs to the teacher's school
      if (
        !userToUpdate.school ||
        userToUpdate.school.toString() !== req.user.school.toString()
      ) {
        throw new ForbiddenException(
          'You can only update students in your school',
        );
      }

      // Teachers can only update students
      if (userToUpdate.role !== UserRole.STUDENT) {
        throw new ForbiddenException(
          'Teachers can only update student details',
        );
      }

      // Teachers can update name, mobile, additionalInfo, and student-specific fields but not passwords or activation status
      allowedFields = [
        'name',
        'mobile',
        'additionalInfo',
        'parentLanguage',
        'parentOccupation',
      ];
    }

    // If trying to update isActive but not allowed
    if (dto.isActive !== undefined && !allowedFields.includes('isActive')) {
      throw new ForbiddenException(
        'You are not allowed to activate/deactivate users',
      );
    }

    return this.userService.updateUser(id, dto, allowedFields);
  }

  @Patch('block/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  async blockUser(@Param('id') id: string, @Req() req) {
    if (req.user.userId === id)
      throw new ForbiddenException("You can't block yourself");

    const userToBlock = await this.userService.getUserById(id);
    if (!userToBlock) throw new ForbiddenException('User not found');

    const userRole = req.user.role;

    // SCHOOLADMIN can only block users in their school
    if (userRole === UserRole.SCHOOLADMIN) {
      // Check if the user belongs to the schooladmin's school
      if (
        !userToBlock.school ||
        userToBlock.school.toString() !== req.user.schoolId?.toString()
      ) {
        throw new ForbiddenException('You can only block users in your school');
      }

      // Can't block users with higher privileges
      if (
        userToBlock.role === UserRole.SUPERADMIN ||
        userToBlock.role === UserRole.SCHOOLADMIN
      ) {
        throw new ForbiddenException(
          'You cannot block users with higher privileges',
        );
      }
    }

    return this.userService.blockUser(id);
  }

  @Patch('unblock/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  async unblockUser(@Param('id') id: string, @Req() req) {
    const userToUnblock = await this.userService.getUserById(id);
    if (!userToUnblock) throw new ForbiddenException('User not found');

    const userRole = req.user.role;

    // SCHOOLADMIN can only unblock users in their school
    if (userRole === UserRole.SCHOOLADMIN) {
      // Check if the user belongs to the schooladmin's school
      if (
        !userToUnblock.school ||
        userToUnblock.school.toString() !== req.user.schoolId?.toString()
      ) {
        throw new ForbiddenException(
          'You can only unblock users in your school',
        );
      }

      // Can't unblock users with higher privileges
      if (
        userToUnblock.role === UserRole.SUPERADMIN ||
        userToUnblock.role === UserRole.SCHOOLADMIN
      ) {
        throw new ForbiddenException(
          'You cannot unblock users with higher privileges',
        );
      }
    }

    return this.userService.unblockUser(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  async deleteUser(@Param('id') id: string, @Req() req) {
    if (req.user.userId === id)
      throw new ForbiddenException("You can't delete yourself");
    return this.userService.deleteUser(id);
  }

  @Put('profile')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  async updateOwnProfile(@Body() dto: UpdateUserDto, @Req() req) {
    const userId = req.user.id;

    // Define which fields users can update about themselves
    const allowedFields = ['name', 'email', 'mobile', 'additionalInfo'];

    // If updating additionalInfo, ensure we're only updating allowed properties
    if (dto.additionalInfo) {
      // Keep only safe properties that users should be able to update
      // You can customize this list based on your application needs
      const safeProperties = ['address', 'bio', 'preferences'];

      const filteredAdditionalInfo: Record<string, any> = {};
      Object.keys(dto.additionalInfo).forEach((key) => {
        if (safeProperties.includes(key) && dto.additionalInfo) {
          filteredAdditionalInfo[key] = dto.additionalInfo[key];
        }
      });

      // Replace with filtered version
      dto.additionalInfo = filteredAdditionalInfo;
    }

    return this.userService.updateUser(userId, dto, allowedFields);
  }
}
