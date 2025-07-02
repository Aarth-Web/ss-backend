import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TwilioTestService } from './services/twilio-test.service';
import { UserRole } from '../user/user-role.enum';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private twilioTestService: TwilioTestService,
  ) {}

  /**
   * Create new attendance record
   * All roles except student can mark attendance
   */
  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  mark(@Body() markAttendanceDto: MarkAttendanceDto, @Req() req) {
    return this.attendanceService.markAttendance(markAttendanceDto, req.user);
  }

  /**
   * Get attendance records with filtering
   * All roles can get attendance data
   * Students can only see their own attendance
   */
  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  getAttendance(@Query() query: GetAttendanceDto, @Req() req) {
    return this.attendanceService.getAttendance(query, req.user);
  }

  /**
   * Get a specific attendance record by ID
   */
  @Get(':id')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  getAttendanceById(@Param('id') id: string) {
    return this.attendanceService.getAttendanceById(id);
  }

  /**
   * Update attendance record
   * All roles except student can update attendance
   */
  @Put(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  updateAttendance(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @Req() req,
  ) {
    return this.attendanceService.updateAttendance(
      id,
      updateAttendanceDto,
      req.user,
    );
  }

  /**
   * Delete attendance record
   * Only superadmin or school admin can delete
   */
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  deleteAttendance(@Param('id') id: string, @Req() req) {
    return this.attendanceService.deleteAttendance(id, req.user);
  }

  /**
   * Test the SMS service using Twilio
   * Only superadmin and school admin can test SMS
   */
  @Post('test-sms')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN)
  async testSms(@Body('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      return { success: false, message: 'Phone number is required' };
    }

    const result = await this.twilioTestService.sendTestMessage(phoneNumber);

    return {
      success: result,
      message: result
        ? 'Test SMS sent successfully. Check your phone for the message.'
        : 'Failed to send test SMS. Check the server logs for details.',
    };
  }

  /**
   * Get all attendance records for a specific classroom
   * SUPERADMIN and SCHOOLADMIN can access any classroom records
   * TEACHER can only access records for classrooms they teach
   */
  @Get('classroom/:classroomId')
  @Roles(UserRole.SUPERADMIN, UserRole.SCHOOLADMIN, UserRole.TEACHER)
  getClassroomAttendance(
    @Param('classroomId') classroomId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Req() req,
  ) {
    return this.attendanceService.getClassroomAttendanceRecords(
      classroomId,
      req.user,
      Number(page),
      Number(limit),
    );
  }
}
