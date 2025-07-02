import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../attendance.service';
import { getModelToken } from '@nestjs/mongoose';
import { Attendance } from '../attendance.schema';
import { User } from '../../user/user.schema';
import { SmsService } from '../services/sms.service';
import { UserRole } from '../../user/user-role.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceModel: Model<Attendance>;
  let userModel: Model<User>;
  let smsService: SmsService;

  const mockAttendanceModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
    sort: jest.fn(),
    populate: jest.fn(),
  };

  const mockUserModel = {
    find: jest.fn(),
  };

  const mockSmsService = {
    sendSmsToParents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getModelToken(Attendance.name),
          useValue: mockAttendanceModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceModel = module.get<Model<Attendance>>(
      getModelToken(Attendance.name),
    );
    userModel = module.get<Model<User>>(getModelToken(User.name));
    smsService = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markAttendance', () => {
    it('should create attendance record', async () => {
      // Arrange
      const mockAttendanceDto = {
        classroomId: 'classroom-id',
        date: '2023-07-01',
        records: [
          { student: 'student-1', present: true },
          { student: 'student-2', present: false },
        ],
        sendSmsTo: [],
        sendSmsToAllAbsent: false,
      };

      const mockUser = { _id: 'user-id', role: UserRole.TEACHER };
      const mockAttendanceDoc = {
        _id: 'attendance-id',
        classroom: 'classroom-id',
        date: new Date('2023-07-01'),
        records: [
          { student: 'student-1', present: true },
          { student: 'student-2', present: false },
        ],
      };

      mockAttendanceModel.create.mockResolvedValue(mockAttendanceDoc);

      // Act
      const result = await service.markAttendance(
        mockAttendanceDto,
        mockUser as any,
      );

      // Assert
      expect(mockAttendanceModel.create).toHaveBeenCalledWith({
        classroom: mockAttendanceDto.classroomId,
        date: expect.any(Date),
        records: mockAttendanceDto.records,
      });
      expect(result).toEqual(mockAttendanceDoc);
    });

    it('should send SMS to absent students if requested', async () => {
      // Arrange
      const mockAttendanceDto = {
        classroomId: 'classroom-id',
        date: '2023-07-01',
        records: [
          { student: 'student-1', present: true },
          { student: 'student-2', present: false },
        ],
        sendSmsTo: [],
        sendSmsToAllAbsent: true,
      };

      const mockUser = { _id: 'user-id', role: UserRole.TEACHER };
      const mockAttendanceDoc = {
        _id: 'attendance-id',
        classroom: 'classroom-id',
        date: new Date('2023-07-01'),
        records: [
          { student: 'student-1', present: true },
          { student: 'student-2', present: false },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock all needed functions
      mockAttendanceModel.create.mockResolvedValue(mockAttendanceDoc);
      mockAttendanceModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAttendanceDoc),
      });
      mockSmsService.sendSmsToParents.mockResolvedValue(true);

      // Act
      const result = await service.markAttendance(
        mockAttendanceDto,
        mockUser as any,
      );

      // Assert
      expect(mockAttendanceModel.create).toHaveBeenCalled();
      expect(mockAttendanceModel.findById).toHaveBeenCalledWith(
        'attendance-id',
      );
      expect(mockSmsService.sendSmsToParents).toHaveBeenCalledWith(
        ['student-2'],
        'classroom-id',
        mockAttendanceDoc.date,
      );
      expect(result).toEqual(mockAttendanceDoc);
    });
  });

  // Additional tests can be added for other methods
});
