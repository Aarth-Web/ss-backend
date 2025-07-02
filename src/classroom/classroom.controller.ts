import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user-role.enum';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  create(@Body() createClassroomDto: CreateClassroomDto, @Request() req) {
    return this.classroomService.create(createClassroomDto, req.user);
  }

  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  findAll(@Request() req) {
    return this.classroomService.findAll(req.user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  findOne(@Param('id') id: string, @Request() req) {
    return this.classroomService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  update(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
    @Request() req,
  ) {
    return this.classroomService.update(id, updateClassroomDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.classroomService.remove(id, req.user);
  }

  @Post(':id/students')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  addStudents(
    @Param('id') id: string,
    @Body() addStudentsDto: AddStudentsDto,
    @Request() req,
  ) {
    return this.classroomService.addStudents(id, addStudentsDto, req.user);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req,
  ) {
    return this.classroomService.removeStudent(id, studentId, req.user);
  }
}
