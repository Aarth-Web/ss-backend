import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadingParagraphService } from './reading-paragraph.service';
import { ReadingParagraphController } from './reading-paragraph.controller';
import {
  ReadingParagraph,
  ReadingParagraphSchema,
} from './reading-paragraph.schema';
import {
  ReadingAssignment,
  ReadingAssignmentSchema,
} from './reading-assignment.schema';
import {
  ReadingCompletion,
  ReadingCompletionSchema,
} from './reading-completion.schema';
import { User, UserSchema } from '../user/user.schema';
import { Classroom, ClassroomSchema } from '../classroom/classroom.schema';
import { ClassroomModule } from '../classroom/classroom.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingParagraph.name, schema: ReadingParagraphSchema },
      { name: ReadingAssignment.name, schema: ReadingAssignmentSchema },
      { name: ReadingCompletion.name, schema: ReadingCompletionSchema },
      { name: User.name, schema: UserSchema },
      { name: Classroom.name, schema: ClassroomSchema },
    ]),
    ClassroomModule,
  ],
  controllers: [ReadingParagraphController],
  providers: [ReadingParagraphService],
  exports: [ReadingParagraphService],
})
export class ReadingParagraphModule {}
