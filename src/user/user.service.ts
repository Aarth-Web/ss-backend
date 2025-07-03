import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user-role.enum';
import { ParentLanguage } from './parent-language.enum';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getAllUsers(role: string, page = 1, limit = 10) {
    const query = role ? { role } : {};
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(query).select('-password').skip(skip).limit(limit),
      this.userModel.countDocuments(query),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, updatedFields: string[]) {
    // Get the existing user to check the role
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    // Handle student-specific fields
    if (user.role === UserRole.STUDENT) {
      // Create or update additionalInfo
      if (!dto.additionalInfo) {
        dto.additionalInfo = {};
      }

      // Add parent language if provided
      if (dto.parentLanguage) {
        dto.additionalInfo.parentLanguage = dto.parentLanguage;
        // Remove it from the top level to avoid it being stored directly
        delete dto.parentLanguage;
      }

      // Add parent occupation if provided
      if (dto.parentOccupation) {
        dto.additionalInfo.parentOccupation = dto.parentOccupation;
        // Remove it from the top level to avoid it being stored directly
        delete dto.parentOccupation;
      }
    }

    // Filter out fields that aren't allowed to be updated
    const filteredUpdate = Object.keys(dto)
      .filter((key) => updatedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = dto[key];
        return obj;
      }, {});

    const updated = await this.userModel
      .findByIdAndUpdate(id, filteredUpdate, {
        new: true,
      })
      .select('-password');

    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async blockUser(id: string) {
    return this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password');
  }

  async getUsersBySchoolId(
    schoolId: string,
    page = 1,
    limit = 10,
    searchQuery?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build the base query
    const query: any = { school: schoolId };

    // Add search functionality if a query is provided
    if (searchQuery) {
      // Search by name, email, mobile, registrationId, or role
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { mobile: { $regex: searchQuery, $options: 'i' } },
        { registrationId: { $regex: searchQuery, $options: 'i' } },
        { role: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).select('-password'),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStudentsBySchoolId(
    schoolId: string,
    page = 1,
    limit = 10,
    searchQuery?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build the base query
    const query: any = {
      school: schoolId,
      role: UserRole.STUDENT, // Only get STUDENT users
    };

    // Add search functionality if a query is provided
    if (searchQuery) {
      // Search by name, email, mobile, or registrationId
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { mobile: { $regex: searchQuery, $options: 'i' } },
        { registrationId: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).select('-password'),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async unblockUser(id: string) {
    return this.userModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .select('-password');
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
