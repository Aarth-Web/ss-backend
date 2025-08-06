import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReadingParagraph } from './reading-paragraph.schema';
import { ReadingAssignment, AssignmentType } from './reading-assignment.schema';
import { ReadingCompletion } from './reading-completion.schema';
import { User } from '../user/user.schema';
import { Classroom } from '../classroom/classroom.schema';
import { UserRole } from '../user/user-role.enum';
import { ClassroomService } from '../classroom/classroom.service';
import {
  CreateReadingParagraphDto,
  UpdateReadingParagraphDto,
  GetReadingParagraphsDto,
  CreateReadingAssignmentDto,
  CompleteReadingAssignmentDto,
  TeacherFeedbackDto,
} from './dto';

@Injectable()
export class ReadingParagraphService {
  private readonly logger = new Logger(ReadingParagraphService.name);

  constructor(
    @InjectModel(ReadingParagraph.name)
    private readingParagraphModel: Model<ReadingParagraph>,
    @InjectModel(ReadingAssignment.name)
    private readingAssignmentModel: Model<ReadingAssignment>,
    @InjectModel(ReadingCompletion.name)
    private readingCompletionModel: Model<ReadingCompletion>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Classroom.name)
    private classroomModel: Model<Classroom>,
    private classroomService: ClassroomService,
  ) {}

  // Reading Paragraph CRUD Operations
  async createParagraph(
    createDto: CreateReadingParagraphDto,
    currentUser: User,
  ): Promise<ReadingParagraph> {
    // Only teachers can create paragraphs
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException(
        'Only teachers can create reading paragraphs',
      );
    }

    const newParagraph = new this.readingParagraphModel({
      ...createDto,
      createdBy: (currentUser as any)._id,
      school: (currentUser as any).school,
    });

    return await newParagraph.save();
  }

  async getParagraphs(
    query: GetReadingParagraphsDto,
    currentUser: User,
  ): Promise<{ data: ReadingParagraph[]; meta: any }> {
    const { difficultyLevel, search, page = 1, limit = 10 } = query;
    // Build filter based on user role
    const filter: any = { isActive: true };

    // Teachers can only see their own paragraphs
    if (currentUser.role === UserRole.TEACHER) {
      filter.createdBy = (currentUser as any)._id;
    }
    // School admins can see paragraphs from their school
    else if (currentUser.role === UserRole.SCHOOLADMIN) {
      filter.school = (currentUser as any).school;
    }
    // Students can see paragraphs from their school
    else if (currentUser.role === UserRole.STUDENT) {
      filter.school = (currentUser as any).school;
    }

    if (difficultyLevel) {
      filter.difficultyLevel = difficultyLevel;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.readingParagraphModel
        .find(filter)
        .populate('createdBy', 'name registrationId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.readingParagraphModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getParagraphById(
    id: string,
    currentUser: User,
  ): Promise<ReadingParagraph> {
    const paragraph = await this.readingParagraphModel
      .findById(id)
      .populate('createdBy', 'name registrationId')
      .exec();

    if (!paragraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    // Check permissions
    if (currentUser.role === UserRole.TEACHER) {
      if (
        (paragraph.createdBy as any)._id.toString() !==
        (currentUser as any)._id.toString()
      ) {
        throw new ForbiddenException(
          'You can only view your own reading paragraphs',
        );
      }
    } else if (currentUser.role === UserRole.SCHOOLADMIN) {
      if (
        paragraph.school.toString() !== (currentUser as any).school.toString()
      ) {
        throw new ForbiddenException(
          'You can only view paragraphs from your school',
        );
      }
    } else if (currentUser.role === UserRole.STUDENT) {
      if (
        paragraph.school.toString() !== (currentUser as any).school.toString()
      ) {
        throw new ForbiddenException(
          'You can only view paragraphs from your school',
        );
      }
    }

    return paragraph;
  }

  // Public method - no authentication required
  async getParagraphByIdPublic(id: string): Promise<ReadingParagraph> {
    const paragraph = await this.readingParagraphModel
      .findById(id)
      .populate('createdBy', 'name registrationId')
      .exec();

    if (!paragraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    return paragraph;
  }

  async updateParagraph(
    id: string,
    updateDto: UpdateReadingParagraphDto,
    currentUser: User,
  ): Promise<ReadingParagraph> {
    const paragraph = await this.readingParagraphModel.findById(id);

    if (!paragraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    // Only the creator can update
    if (
      paragraph.createdBy.toString() !== (currentUser as any)._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only update your own reading paragraphs',
      );
    }

    const updatedParagraph = await this.readingParagraphModel
      .findByIdAndUpdate(
        id,
        { ...updateDto, updatedAt: new Date() },
        { new: true },
      )
      .populate('createdBy', 'name registrationId');

    if (!updatedParagraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    return updatedParagraph;
  }

  async deleteParagraph(id: string, currentUser: User): Promise<void> {
    const paragraph = await this.readingParagraphModel.findById(id);

    if (!paragraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    // Only the creator can delete
    if (
      paragraph.createdBy.toString() !== (currentUser as any)._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only delete your own reading paragraphs',
      );
    }

    // Check if paragraph is used in any assignments
    const assignmentCount = await this.readingAssignmentModel.countDocuments({
      paragraph: id,
      isActive: true,
    });

    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete paragraph as it is used in active assignments',
      );
    }

    await this.readingParagraphModel.findByIdAndDelete(id);
  }

  // Assignment Operations
  async createAssignment(
    createDto: CreateReadingAssignmentDto,
    currentUser: User,
  ): Promise<ReadingAssignment> {
    // Only teachers can create assignments
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create assignments');
    }

    // Verify paragraph exists and belongs to teacher's school
    const paragraph = await this.readingParagraphModel.findById(
      createDto.paragraphId,
    );
    if (!paragraph) {
      throw new NotFoundException('Reading paragraph not found');
    }

    if (
      paragraph.school.toString() !== (currentUser as any).school.toString()
    ) {
      throw new ForbiddenException(
        'You can only assign paragraphs from your school',
      );
    }

    // Validate assignment type specific fields
    if (createDto.type === AssignmentType.INDIVIDUAL) {
      if (!createDto.studentIds || createDto.studentIds.length === 0) {
        throw new BadRequestException(
          'Student IDs are required for individual assignments',
        );
      }

      // Verify all students exist and belong to teacher's school
      const students = await this.userModel.find({
        _id: { $in: createDto.studentIds },
        role: UserRole.STUDENT,
        school: (currentUser as any).school,
      });

      if (students.length !== createDto.studentIds.length) {
        throw new BadRequestException(
          'Some students not found or not in your school',
        );
      }
    } else {
      if (!createDto.classroomId) {
        throw new BadRequestException(
          'Classroom ID is required for classroom assignments',
        );
      }

      // Verify classroom exists and teacher has access
      const classroom = await this.classroomService.findOne(
        createDto.classroomId,
        currentUser,
      );
      if (
        (classroom.teacher as any)._id.toString() !==
        (currentUser as any)._id.toString()
      ) {
        throw new ForbiddenException(
          'You can only assign to your own classrooms',
        );
      }
    }

    const newAssignment = new this.readingAssignmentModel({
      paragraph: createDto.paragraphId,
      assignedBy: (currentUser as any)._id,
      type: createDto.type,
      students:
        createDto.type === AssignmentType.INDIVIDUAL
          ? createDto.studentIds
          : undefined,
      classroom:
        createDto.type === AssignmentType.CLASSROOM
          ? createDto.classroomId
          : undefined,
      dueDate: new Date(createDto.dueDate),
      instructions: createDto.instructions,
    });

    return await newAssignment.save();
  }

  async getStudentAssignments(
    currentUser: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; meta: any }> {
    // Only students can call this method
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can view their assignments');
    }

    // Find classrooms student belongs to
    const classrooms = await this.classroomModel
      .find({
        students: (currentUser as any)._id,
      })
      .select('_id');

    const classroomIds = classrooms.map((c) => c._id);

    // Find assignments (both individual and classroom)
    const filter = {
      isActive: true,
      $or: [
        { type: AssignmentType.INDIVIDUAL, students: (currentUser as any)._id },
        { type: AssignmentType.CLASSROOM, classroom: { $in: classroomIds } },
      ],
    };

    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      this.readingAssignmentModel
        .find(filter)
        .populate('paragraph', 'title difficultyLevel estimatedReadingTime')
        .populate('assignedBy', 'name registrationId')
        .populate('classroom', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.readingAssignmentModel.countDocuments(filter).exec(),
    ]);

    // Check completion status for each assignment
    const assignmentIds = assignments.map((a) => (a as any)._id);
    const completions = await this.readingCompletionModel
      .find({
        assignment: { $in: assignmentIds },
        student: (currentUser as any)._id,
      })
      .select('assignment');

    const completedAssignmentIds = new Set(
      completions.map((c) => c.assignment.toString()),
    );

    const data = assignments.map((assignment) => {
      const isCompleted = completedAssignmentIds.has(
        (assignment as any)._id.toString(),
      );
      const now = new Date();
      const isOverdue = !isCompleted && new Date(assignment.dueDate) < now;

      return {
        ...assignment.toObject(),
        status: isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending',
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAssignmentById(id: string, currentUser: User): Promise<any> {
    const assignment = await this.readingAssignmentModel
      .findById(id)
      .populate('paragraph')
      .populate('assignedBy', 'name registrationId')
      .populate('classroom', 'name')
      .populate('students', 'name registrationId')
      .exec();

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student has access to this assignment
    if (currentUser.role === UserRole.STUDENT) {
      const hasAccess =
        (assignment.type === AssignmentType.INDIVIDUAL &&
          assignment.students.some(
            (s: any) =>
              s._id.toString() === (currentUser as any)._id.toString(),
          )) ||
        (assignment.type === AssignmentType.CLASSROOM &&
          (await this.classroomModel.exists({
            _id: (assignment.classroom as any)._id,
            students: (currentUser as any)._id,
          })));

      if (!hasAccess) {
        throw new ForbiddenException(
          'You do not have access to this assignment',
        );
      }

      // Check if completed
      const completion = await this.readingCompletionModel.findOne({
        assignment: id,
        student: (currentUser as any)._id,
      });

      return {
        ...assignment.toObject(),
        completion,
        status: completion
          ? 'completed'
          : new Date(assignment.dueDate) < new Date()
            ? 'overdue'
            : 'pending',
      };
    }

    // For teachers, show all completion data
    if (currentUser.role === UserRole.TEACHER) {
      if (
        (assignment.assignedBy as any)._id.toString() !==
        (currentUser as any)._id.toString()
      ) {
        throw new ForbiddenException('You can only view your own assignments');
      }

      const completions = await this.readingCompletionModel
        .find({ assignment: id })
        .populate('student', 'name registrationId')
        .exec();

      return {
        ...assignment.toObject(),
        completions,
      };
    }

    return assignment;
  }

  async completeAssignment(
    assignmentId: string,
    completeDto: CompleteReadingAssignmentDto,
    currentUser: User,
  ): Promise<ReadingCompletion> {
    // Only students can complete assignments
    if (currentUser.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can complete assignments');
    }

    const assignment = await this.readingAssignmentModel.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Check if student has access to this assignment
    const hasIndividualAccess =
      assignment.type === AssignmentType.INDIVIDUAL &&
      assignment.students.some(
        (studentId: any) =>
          studentId.toString() === (currentUser as any)._id.toString(),
      );

    const hasClassroomAccess =
      assignment.type === AssignmentType.CLASSROOM &&
      (await this.classroomModel.exists({
        _id: assignment.classroom,
        students: (currentUser as any)._id,
      }));

    if (!hasIndividualAccess && !hasClassroomAccess) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    // Check if already completed
    const existingCompletion = await this.readingCompletionModel.findOne({
      assignment: assignmentId,
      student: (currentUser as any)._id,
    });

    if (existingCompletion) {
      // Update existing completion
      Object.assign(existingCompletion, {
        ...completeDto,
        completedAt: new Date(),
        attemptCount: existingCompletion.attemptCount + 1,
      });
      return await existingCompletion.save();
    }

    // Create new completion
    const completion = new this.readingCompletionModel({
      assignment: assignmentId,
      student: (currentUser as any)._id,
      completedAt: new Date(),
      ...completeDto,
    });

    return await completion.save();
  }

  async addTeacherFeedback(
    completionId: string,
    feedbackDto: TeacherFeedbackDto,
    currentUser: User,
  ): Promise<ReadingCompletion> {
    // Only teachers can add feedback
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can add feedback');
    }

    const completion = await this.readingCompletionModel
      .findById(completionId)
      .populate({
        path: 'assignment',
        populate: { path: 'assignedBy' },
      })
      .exec();

    if (!completion) {
      throw new NotFoundException('Completion record not found');
    }

    // Check if teacher owns this assignment
    if (
      (completion.assignment as any).assignedBy._id.toString() !==
      (currentUser as any)._id.toString()
    ) {
      throw new ForbiddenException(
        'You can only add feedback to your own assignments',
      );
    }

    Object.assign(completion, {
      ...feedbackDto,
      updatedAt: new Date(),
    });

    return await completion.save();
  }

  async getTeacherAssignments(
    currentUser: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; meta: any }> {
    // Only teachers can call this method
    if (currentUser.role !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can view their assignments');
    }

    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      this.readingAssignmentModel
        .find({ assignedBy: (currentUser as any)._id, isActive: true })
        .populate('paragraph', 'title difficultyLevel')
        .populate('classroom', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.readingAssignmentModel
        .countDocuments({
          assignedBy: (currentUser as any)._id,
          isActive: true,
        })
        .exec(),
    ]);

    // Get completion statistics for each assignment
    const assignmentStats = await Promise.all(
      assignments.map(async (assignment) => {
        const completions = await this.readingCompletionModel.countDocuments({
          assignment: assignment._id,
        });

        let totalStudents = 0;
        if (assignment.type === AssignmentType.INDIVIDUAL) {
          totalStudents = assignment.students.length;
        } else {
          const classroom = await this.classroomModel.findById(
            assignment.classroom,
          );
          totalStudents = classroom ? classroom.students.length : 0;
        }

        return {
          ...assignment.toObject(),
          completionStats: {
            completed: completions,
            total: totalStudents,
            percentage:
              totalStudents > 0
                ? Math.round((completions / totalStudents) * 100)
                : 0,
          },
        };
      }),
    );

    return {
      data: assignmentStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
