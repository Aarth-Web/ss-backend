import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Patch,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  async createSchool(@Body() dto: CreateSchoolDto, @Req() req) {
    return this.schoolService.createSchool(dto, req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  async getSchoolById(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
  ) {
    // If SCHOOLADMIN, verify they belong to this school
    if (req.user.role === UserRole.SCHOOLADMIN) {
      if (req.user.schoolId && req.user.schoolId.toString() !== id) {
        throw new ForbiddenException('You can only view your own school');
      }
    }

    // If TEACHER, verify they belong to this school and return limited info
    if (req.user.role === UserRole.TEACHER) {
      if (req.user.schoolId && req.user.schoolId.toString() !== id) {
        throw new ForbiddenException('You can only view your own school');
      }
      return this.schoolService.getSchoolLimitedInfo(id);
    }

    return this.schoolService.getSchoolWithUsers(id, page, limit);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  async getAllSchools(
    @Query('search') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
  ) {
    // If SCHOOLADMIN, they can only view their own school
    if (req.user.role === UserRole.SCHOOLADMIN && req.user.schoolId) {
      // For SCHOOLADMIN we return only their school regardless of search params
      return this.schoolService.getSchoolWithUsers(
        req.user.schoolId.toString(),
        Number(page),
        Number(limit),
      );
    }

    // For SUPERADMIN, proceed with the original logic
    if (query) {
      return this.schoolService.searchSchools(
        query,
        Number(page),
        Number(limit),
      );
    }
    return this.schoolService.getAllSchools(Number(page), Number(limit));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  async updateSchool(
    @Param('id') id: string,
    @Body() updateDto: UpdateSchoolDto,
    @Req() req,
  ) {
    const userRole = req.user.role;

    // Define allowed fields based on user role
    let allowedFields: string[] = ['name', 'address'];

    // SUPERADMIN can also update isActive status and other fields
    if (userRole === UserRole.SUPERADMIN) {
      allowedFields = [...allowedFields, 'isActive'];
    }
    // For SCHOOLADMIN, verify that they belong to this school
    else if (userRole === UserRole.SCHOOLADMIN) {
      // If this SCHOOLADMIN is trying to update isActive, it's forbidden
      if (updateDto.isActive !== undefined) {
        throw new ForbiddenException(
          'You are not authorized to change school activation status',
        );
      }

      // We should verify that this SCHOOLADMIN belongs to the school they're trying to update
      if (req.user.schoolId && req.user.schoolId.toString() !== id) {
        throw new ForbiddenException('You can only update your own school');
      }
    }

    return this.schoolService.updateSchool(
      id,
      updateDto,
      userRole,
      allowedFields,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  async deleteSchool(@Param('id') id: string) {
    return this.schoolService.deleteSchool(id);
  }
}
