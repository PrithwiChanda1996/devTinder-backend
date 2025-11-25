import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import {
  Connection,
  ConnectionDocument,
} from "../connections/entities/connection.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Connection.name)
    private connectionModel: Model<ConnectionDocument>
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select("-password");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select("-password");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async findByMobile(mobileNumber: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ mobileNumber })
      .select("-password");

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    Object.assign(user, updateUserDto);
    await user.save();

    return this.findById(userId);
  }

  async getSuggestions(userId: string, limit: number = 10): Promise<any[]> {
    // Find all connections where user is involved with pending, accepted, or blocked status
    const connections = await this.connectionModel.find({
      $or: [
        {
          fromUserId: new Types.ObjectId(userId),
          status: { $in: ["pending", "accepted", "blocked"] },
        },
        {
          toUserId: new Types.ObjectId(userId),
          status: { $in: ["pending", "accepted", "blocked"] },
        },
      ],
    });

    // Build set of user IDs to exclude (including self)
    const excludedUserIds = new Set<string>();
    excludedUserIds.add(userId);

    connections.forEach((conn) => {
      excludedUserIds.add(conn.fromUserId.toString());
      excludedUserIds.add(conn.toUserId.toString());
    });

    // Convert to ObjectId array for query
    const excludedIds = Array.from(excludedUserIds).map(
      (id) => new Types.ObjectId(id)
    );

    // Get random users using $sample
    const users = await this.userModel.aggregate([
      {
        $match: {
          _id: {
            $nin: excludedIds,
          },
        },
      },
      { $sample: { size: limit } },
      { $project: { password: 0, createdAt: 0, updatedAt: 0, __v: 0 } },
    ]);

    return users;
  }
}
