import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School } from './school.schema';
import { CreateSchoolDto } from './dto/create-school.dto';
import { generateRegistrationId } from '../auth/utils/generate-reg-id';
import { User } from '../user/user.schema'; // Import User schema

@Injectable()
export class SchoolService {
  constructor(
    @InjectModel(School.name) private schoolModel: Model<School>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createSchool(dto: CreateSchoolDto, createdBy: string) {
    const regId = generateRegistrationId();
    const school = new this.schoolModel({
      name: dto.name,
      registrationId: regId,
      address: dto.address,
      createdBy,
    });

    await school.save();
    return {
      message: 'School created successfully',
      schoolId: school._id,
      registrationId: school.registrationId,
    };
  }

  async getSchoolWithUsers(id: string, page = 1, limit = 10) {
    const school = await this.schoolModel.findById(id);
    if (!school) throw new NotFoundException('School not found');

    return {
      school,
      page,
      limit,
    };
  }

  async getSchoolLimitedInfo(id: string) {
    const school = await this.schoolModel.findById(id).select('name address');
    if (!school) throw new NotFoundException('School not found');

    return {
      school: {
        name: school.name,
        address: school.address,
      },
    };
  }

  async getAllSchools(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const schools = await this.schoolModel
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.schoolModel.countDocuments();

    return {
      schools,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async searchSchools(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(query, 'i');

    const schools = await this.schoolModel
      .find({
        $or: [
          { name: searchRegex },
          { address: searchRegex },
          { registrationId: searchRegex },
        ],
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.schoolModel.countDocuments({
      $or: [
        { name: searchRegex },
        { address: searchRegex },
        { registrationId: searchRegex },
      ],
    });

    return {
      schools,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async updateSchool(
    id: string,
    updateData: any,
    userRole: string,
    allowedFields: string[],
  ) {
    const school = await this.schoolModel.findById(id);
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Filter the updateData to only include allowed fields based on user role
    const filteredUpdateData = {};
    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key];
      }
    }

    // Update the school with filtered data
    Object.assign(school, filteredUpdateData);
    await school.save();

    return {
      message: 'School updated successfully',
      school,
    };
  }

  async deleteSchool(id: string) {
    const result = await this.schoolModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('School not found');
    }
    return { message: 'School deleted successfully' };
  }
}
