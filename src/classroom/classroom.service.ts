import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Classroom } from './classroom.schema';
import { User } from '../user/user.schema';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { UserRole } from '../user/user-role.enum';

@Injectable()
export class ClassroomService {
  constructor(
    @InjectModel(Classroom.name) private classroomModel: Model<Classroom>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createClassroomDto: CreateClassroomDto, user: any) {
    // Verify teacher exists and is a teacher
    const teacher = await this.userModel.findById(createClassroomDto.teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException('The specified user is not a teacher');
    }

    // Only allow creating classrooms in your own school unless superadmin
    if (
      user.role !== UserRole.SUPERADMIN &&
      user.role !== UserRole.SCHOOLADMIN &&
      user.school.toString() !== createClassroomDto.schoolId
    ) {
      throw new ForbiddenException(
        'You can only create classrooms for your own school',
      );
    }

    // Create classroom
    const newClassroom = new this.classroomModel({
      name: createClassroomDto.name,
      description: createClassroomDto.description,
      teacher: createClassroomDto.teacherId,
      school: createClassroomDto.schoolId,
      students: [],
    });

    return await newClassroom.save();
  }

  async findAll(user: any) {
    // Filter classrooms based on user role
    if (user.role === UserRole.SUPERADMIN) {
      // Superadmin can see all classrooms
      return this.classroomModel
        .find()
        .populate('teacher', 'name registrationId')
        .populate('school', 'name');
    } else if (user.role === UserRole.SCHOOLADMIN) {
      // School admin can see classrooms from their school
      return this.classroomModel
        .find({ school: user.school })
        .populate('teacher', 'name registrationId')
        .populate('school', 'name');
    } else if (user.role === UserRole.TEACHER) {
      // Teachers can see classrooms they teach
      return this.classroomModel
        .find({ teacher: user._id })
        .populate('teacher', 'name registrationId')
        .populate('school', 'name');
    } else {
      // Students can see classrooms they're in
      return this.classroomModel
        .find({ students: user._id })
        .populate('teacher', 'name registrationId')
        .populate('school', 'name');
    }
  }

  async findOne(id: string, user: any) {
    const classroom = await this.classroomModel
      .findById(id)
      .populate('teacher', 'name registrationId')
      .populate('school', 'name')
      .populate('students', 'name registrationId');

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // Check permissions
    if (user.role !== UserRole.SUPERADMIN) {
      // School admin can only view their school's classrooms
      if (
        user.role === UserRole.SCHOOLADMIN &&
        classroom.school.id.toString() !== user.school.toString()
      ) {
        throw new ForbiddenException(
          'You can only view classrooms from your school',
        );
      }

      // Teacher can only view their own classrooms
      if (user.role === UserRole.TEACHER && classroom.teacher.id !== user.id) {
        throw new ForbiddenException('You can only view your own classrooms');
      }

      // Student can only view classrooms they're in
      if (
        user.role === UserRole.STUDENT &&
        !classroom.students.some((student) => student.id === user.id)
      ) {
        throw new ForbiddenException(
          'You can only view classrooms you are enrolled in',
        );
      }
    }

    return classroom;
  }

  async update(id: string, updateClassroomDto: UpdateClassroomDto, user: any) {
    const classroom = await this.classroomModel.findById(id);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // Check permissions
    if (
      user.role === UserRole.TEACHER &&
      classroom.teacher.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException('You can only update your own classrooms');
    }

    if (
      user.role === UserRole.SCHOOLADMIN &&
      classroom.school.toString() !== user.school.toString()
    ) {
      throw new ForbiddenException(
        'You can only update classrooms in your school',
      );
    }

    // If changing teacher, verify new teacher exists and is a teacher
    if (updateClassroomDto.teacherId) {
      const newTeacher = await this.userModel.findById(
        updateClassroomDto.teacherId,
      );
      if (!newTeacher) {
        throw new NotFoundException('Teacher not found');
      }

      if (newTeacher.role !== UserRole.TEACHER) {
        throw new BadRequestException('The specified user is not a teacher');
      }
    }

    return await this.classroomModel.findByIdAndUpdate(
      id,
      {
        ...(updateClassroomDto.name && { name: updateClassroomDto.name }),
        ...(updateClassroomDto.description && {
          description: updateClassroomDto.description,
        }),
        ...(updateClassroomDto.teacherId && {
          teacher: updateClassroomDto.teacherId,
        }),
      },
      { new: true },
    );
  }

  async remove(id: string, user: any) {
    const classroom = await this.classroomModel.findById(id);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // Check permissions
    if (user.role === UserRole.TEACHER) {
      throw new ForbiddenException('Teachers cannot delete classrooms');
    }

    if (
      user.role === UserRole.SCHOOLADMIN &&
      classroom.school.toString() !== user.school.toString()
    ) {
      throw new ForbiddenException(
        'You can only delete classrooms in your school',
      );
    }

    await this.classroomModel.findByIdAndDelete(id);
    return { message: 'Classroom deleted successfully' };
  }

  async addStudents(id: string, addStudentsDto: AddStudentsDto, user: any) {
    const classroom = await this.classroomModel.findById(id);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // Check permissions
    if (
      user.role === UserRole.TEACHER &&
      classroom.teacher.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only add students to your own classrooms',
      );
    }

    if (
      user.role === UserRole.SCHOOLADMIN &&
      classroom.school.toString() !== user.school.toString()
    ) {
      throw new ForbiddenException(
        'You can only add students to classrooms in your school',
      );
    }

    // Verify all students exist and are students
    const students = await this.userModel.find({
      _id: { $in: addStudentsDto.studentIds },
      role: UserRole.STUDENT,
    });

    if (students.length !== addStudentsDto.studentIds.length) {
      throw new BadRequestException(
        'All IDs must belong to valid student accounts',
      );
    }

    // Add students to classroom (avoiding duplicates)
    const currentStudentIds = classroom.students.map((id) => id.toString());
    const newStudentIds = addStudentsDto.studentIds.filter(
      (id) => !currentStudentIds.includes(id.toString()),
    );

    if (newStudentIds.length === 0) {
      return { message: 'All students are already in the classroom' };
    }

    const updatedClassroom = await this.classroomModel
      .findByIdAndUpdate(
        id,
        {
          $addToSet: { students: { $each: newStudentIds } },
        },
        { new: true },
      )
      .populate('students', 'name registrationId');

    return {
      message: `${newStudentIds.length} students added to classroom`,
      classroom: updatedClassroom,
    };
  }

  async removeStudent(classroomId: string, studentId: string, user: any) {
    const classroom = await this.classroomModel.findById(classroomId);
    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // Check permissions
    if (
      user.role === UserRole.TEACHER &&
      classroom.teacher.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only remove students from your own classrooms',
      );
    }

    if (
      user.role === UserRole.SCHOOLADMIN &&
      classroom.school.toString() !== user.school.toString()
    ) {
      throw new ForbiddenException(
        'You can only remove students from classrooms in your school',
      );
    }

    // Remove student from classroom
    const updatedClassroom = await this.classroomModel.findByIdAndUpdate(
      classroomId,
      {
        $pull: { students: studentId },
      },
      { new: true },
    );

    return {
      message: 'Student removed from classroom',
      classroom: updatedClassroom,
    };
  }
}
