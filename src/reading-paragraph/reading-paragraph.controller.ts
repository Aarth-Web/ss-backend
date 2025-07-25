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
  Query,
} from '@nestjs/common';
import { ReadingParagraphService } from './reading-paragraph.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../user/user-role.enum';
import {
  CreateReadingParagraphDto,
  UpdateReadingParagraphDto,
  GetReadingParagraphsDto,
  CreateReadingAssignmentDto,
  CompleteReadingAssignmentDto,
  TeacherFeedbackDto,
} from './dto';

@Controller('reading-paragraphs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReadingParagraphController {
  constructor(
    private readonly readingParagraphService: ReadingParagraphService,
  ) {}

  // Reading Paragraph CRUD endpoints
  @Post()
  @Roles(UserRole.TEACHER)
  createParagraph(
    @Body() createDto: CreateReadingParagraphDto,
    @Request() req,
  ) {
    return this.readingParagraphService.createParagraph(createDto, req.user);
  }

  @Get()
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  getParagraphs(@Query() query: GetReadingParagraphsDto, @Request() req) {
    return this.readingParagraphService.getParagraphs(query, req.user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.SCHOOLADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
  )
  getParagraphById(@Param('id') id: string, @Request() req) {
    return this.readingParagraphService.getParagraphById(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER)
  updateParagraph(
    @Param('id') id: string,
    @Body() updateDto: UpdateReadingParagraphDto,
    @Request() req,
  ) {
    return this.readingParagraphService.updateParagraph(
      id,
      updateDto,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER)
  deleteParagraph(@Param('id') id: string, @Request() req) {
    return this.readingParagraphService.deleteParagraph(id, req.user);
  }

  // Assignment endpoints
  @Post('assignments')
  @Roles(UserRole.TEACHER)
  createAssignment(
    @Body() createDto: CreateReadingAssignmentDto,
    @Request() req,
  ) {
    return this.readingParagraphService.createAssignment(createDto, req.user);
  }

  @Get('assignments/my-assignments')
  @Roles(UserRole.STUDENT)
  getStudentAssignments(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.readingParagraphService.getStudentAssignments(
      req.user,
      page,
      limit,
    );
  }

  @Get('assignments/teacher-assignments')
  @Roles(UserRole.TEACHER)
  getTeacherAssignments(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.readingParagraphService.getTeacherAssignments(
      req.user,
      page,
      limit,
    );
  }

  @Get('assignments/:id')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  getAssignmentById(@Param('id') id: string, @Request() req) {
    return this.readingParagraphService.getAssignmentById(id, req.user);
  }

  @Post('assignments/:id/complete')
  @Roles(UserRole.STUDENT)
  completeAssignment(
    @Param('id') id: string,
    @Body() completeDto: CompleteReadingAssignmentDto,
    @Request() req,
  ) {
    return this.readingParagraphService.completeAssignment(
      id,
      completeDto,
      req.user,
    );
  }

  @Post('completions/:id/feedback')
  @Roles(UserRole.TEACHER)
  addTeacherFeedback(
    @Param('id') id: string,
    @Body() feedbackDto: TeacherFeedbackDto,
    @Request() req,
  ) {
    return this.readingParagraphService.addTeacherFeedback(
      id,
      feedbackDto,
      req.user,
    );
  }
}
