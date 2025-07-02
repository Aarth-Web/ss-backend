import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Attendance } from './attendance.schema';
import { Model, Types } from 'mongoose';
import { SmsService } from './services/sms.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UserRole } from '../user/user-role.enum';
import { ClassroomService } from '../classroom/classroom.service';
import { User } from '../user/user.schema';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(User.name) private userModel: Model<User>,
    private smsService: SmsService,
    private classroomService: ClassroomService,
  ) {}

  /**
   * Create attendance record
   */
  async markAttendance(attendanceData: MarkAttendanceDto, currentUser: User) {
    // Create the attendance record
    const attendance = await this.attendanceModel.create({
      classroom: attendanceData.classroomId,
      date: new Date(attendanceData.date),
      records: attendanceData.records,
    });

    // Trigger SMS notifications asynchronously if requested
    if (attendanceData.sendSmsToAllAbsent || attendanceData.sendSmsTo?.length) {
      // Start the notification process without awaiting it
      this.sendAbsenceNotifications(attendance.id, attendanceData);
    }

    // Return the attendance record immediately without waiting for SMS to be sent
    return {
      ...attendance.toObject(),
      smsStatus:
        attendanceData.sendSmsToAllAbsent || attendanceData.sendSmsTo?.length
          ? 'SMS notifications are being processed in the background'
          : 'No SMS notifications requested',
    };
  }

  /**
   * Get attendance records with filtering options
   */
  async getAttendance(query: GetAttendanceDto, currentUser: User) {
    const filter: any = {};

    // Apply filters if provided
    if (query.classroomId) {
      filter.classroom = new Types.ObjectId(query.classroomId);
    }

    if (query.startDate && query.endDate) {
      filter.date = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    } else if (query.startDate) {
      filter.date = { $gte: new Date(query.startDate) };
    } else if (query.endDate) {
      filter.date = { $lte: new Date(query.endDate) };
    }

    // If student role, only show their own attendance
    if (currentUser.role === UserRole.STUDENT) {
      filter['records.student'] = currentUser._id;
    }

    // If looking for a specific student (teachers and admins can do this)
    if (query.studentId && currentUser.role !== UserRole.STUDENT) {
      filter['records.student'] = new Types.ObjectId(query.studentId);
    }

    // Get attendance records with populated data
    const records = await this.attendanceModel
      .find(filter)
      .populate('classroom', 'name')
      .populate('records.student', 'name')
      .sort({ date: -1 })
      .exec();

    return records;
  }

  /**
   * Get a specific attendance record by ID
   */
  async getAttendanceById(id: string) {
    const attendance = await this.attendanceModel
      .findById(id)
      .populate('classroom', 'name')
      .populate('records.student', 'name')
      .exec();

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  /**
   * Update attendance record
   */
  async updateAttendance(
    id: string,
    updateData: UpdateAttendanceDto,
    currentUser: User,
  ) {
    const attendance = await this.attendanceModel.findById(id).exec();

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    // Update fields if provided
    if (updateData.date) {
      attendance.date = new Date(updateData.date);
    }

    if (updateData.records) {
      attendance.records = updateData.records.map((record) => ({
        ...record,
        student: new Types.ObjectId(record.student),
      }));
    }

    await attendance.save();

    // Trigger SMS notifications asynchronously if requested
    if (updateData.sendSmsToAllAbsent || updateData.sendSmsTo?.length) {
      // Start the notification process without awaiting it
      this.sendAbsenceNotifications(id, updateData);
    }

    // Return the attendance record immediately without waiting for SMS to be sent
    return {
      ...attendance.toObject(),
      smsStatus:
        updateData.sendSmsToAllAbsent || updateData.sendSmsTo?.length
          ? 'SMS notifications are being processed in the background'
          : 'No SMS notifications requested',
    };
  }

  /**
   * Delete attendance record
   * Only superadmin or school admin can delete
   */
  async deleteAttendance(id: string, currentUser: User) {
    // Check if user has permission to delete
    if (
      currentUser.role !== UserRole.SUPERADMIN &&
      currentUser.role !== UserRole.SCHOOLADMIN
    ) {
      throw new ForbiddenException(
        'Only superadmin or school admin can delete attendance records',
      );
    }

    const result = await this.attendanceModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Attendance record not found');
    }

    return { message: 'Attendance record deleted successfully' };
  }

  /**
   * Send notifications to parents of absent students
   * This is now asynchronous - it triggers the SMS sending process but returns immediately
   */
  private async sendAbsenceNotifications(
    attendanceId: string,
    data: MarkAttendanceDto | UpdateAttendanceDto,
  ) {
    try {
      const attendance = await this.attendanceModel
        .findById(attendanceId)
        .exec();
      if (!attendance) return;

      let studentsToNotify: string[] = [];

      // If sending to all absent students
      if (data.sendSmsToAllAbsent) {
        // Get all absent student IDs
        studentsToNotify = attendance.records
          .filter((record) => !record.present)
          .map((record) => record.student.toString());
      }
      // If sending to specific students
      else if (data.sendSmsTo && data.sendSmsTo.length > 0) {
        studentsToNotify = data.sendSmsTo;
      }

      if (studentsToNotify.length > 0) {
        // Mark the attendance record as having SMS in progress
        attendance.smsSent = true;
        attendance.smsNotifiedStudents = studentsToNotify.map(
          (id) => new Types.ObjectId(id),
        );
        await attendance.save();

        // Trigger SMS sending process asynchronously without waiting for completion
        this.smsService.triggerSmsToParents(
          studentsToNotify,
          attendance.classroom.toString(),
          attendance.date,
        );

        this.logger.log(
          `SMS notifications triggered for ${studentsToNotify.length} students`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send SMS notifications: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get all attendance records for a specific classroom
   * With role-based access control
   */
  async getClassroomAttendanceRecords(
    classroomId: string,
    currentUser: any,
    page = 1,
    limit = 10,
  ) {
    // Validate classroomId format
    try {
      new Types.ObjectId(classroomId);
    } catch (e) {
      throw new BadRequestException('Invalid classroom ID format');
    }

    // First check if the classroom exists
    try {
      const classroom = await this.classroomService.findOne(
        classroomId,
        currentUser,
      );
      // Apply role-based access control for teachers
      if (currentUser.role === UserRole.TEACHER) {
        // Check if this teacher is assigned to this classroom
        if (classroom.teacher.id !== currentUser.id) {
          throw new ForbiddenException(
            'You can only access attendance records for classes you teach',
          );
        }
      }
      // For SCHOOLADMIN, check if they belong to the same school
      else if (currentUser.role === UserRole.SCHOOLADMIN) {
        if (classroom.school.toString() !== currentUser.school?.toString()) {
          throw new ForbiddenException(
            'You can only access attendance records for classrooms in your school',
          );
        }
      }
      // SUPERADMIN can access any classroom attendance records
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error; // Re-throw permission errors
      }
      throw new NotFoundException('Classroom not found');
    }

    // Calculate pagination parameters
    const skip = (page - 1) * limit;

    // Get attendance records for the classroom with pagination
    const records = await this.attendanceModel
      .find({ classroom: classroomId })
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'records.student',
        select: 'name registrationId',
      })
      .exec();

    // Get total count for pagination metadata
    const totalRecords = await this.attendanceModel
      .countDocuments({ classroom: new Types.ObjectId(classroomId) })
      .exec();

    // Format records to include attendance statistics and enhance student information
    const formattedRecords = records.map((record) => {
      const recordObj = record.toObject();

      // Format each record to include student details
      const enhancedRecords = recordObj.records.map((r) => {
        // Extract student details if populated
        const studentInfo = r.student;

        // Check if student info is populated
        if (
          studentInfo &&
          typeof studentInfo === 'object' &&
          '_id' in studentInfo
        ) {
          return {
            student: {
              id: studentInfo._id,
              name: studentInfo['name'] || 'Unknown',
              registrationId: studentInfo['registrationId'] || 'N/A',
            },
            present: r.present,
          };
        } else {
          return {
            student: { id: r.student },
            present: r.present,
          };
        }
      });

      const totalStudents = record.records.length;
      const presentStudents = record.records.filter((r) => r.present).length;
      const absentStudents = totalStudents - presentStudents;
      const attendanceRate =
        totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

      return {
        ...recordObj,
        records: enhancedRecords,
        statistics: {
          totalStudents,
          presentStudents,
          absentStudents,
          attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        },
      };
    });

    return {
      data: formattedRecords,
      meta: {
        total: totalRecords,
        page,
        limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }
}
