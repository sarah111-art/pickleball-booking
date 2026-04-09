import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { StaffPermissionsController } from './staff-permissions.controller';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, StaffPermissionsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
