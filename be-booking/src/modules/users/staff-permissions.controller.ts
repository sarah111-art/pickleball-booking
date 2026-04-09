import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('staff-permissions')
export class StaffPermissionsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findStaffPermissions() {
    // Get users with role manager
    const users = await this.usersService.findAll();
    return users.filter(u => u.role === 'manager').map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      permissions: u.permissions || [],
    }));
  }
  @Put(':id')
  async updatePermissions(
    @Param('id') id: string,
    @Body()
    body: {
      permissions: {
        section: string;
        level: 'full' | 'add' | 'view' | 'edit' | 'delete';
      }[];
    }
  ) {
    const validLevels = ['full', 'add', 'view', 'edit', 'delete'];

    const isValid = body.permissions.every(p =>
      validLevels.includes(p.level)
    );

    if (!isValid) {
      throw new Error('Invalid permission level');
    }

    return this.usersService.update(id, {
      permissions: body.permissions,
    });
}
}