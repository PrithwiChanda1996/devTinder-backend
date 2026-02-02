import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './entities/user.entity';
import { Connection, ConnectionSchema } from '../connections/entities/connection.entity';
import { S3Service } from '../common/services/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Connection.name, schema: ConnectionSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, S3Service],
  exports: [UsersService],
})
export class UsersModule {}
