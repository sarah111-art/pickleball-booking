import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { PermissionAction } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Controller('staff-permissions')
export class StaffPermissionsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findStaffPermissions() {
    // Get users shown in permission management screen
    const users = await this.usersService.findAll();
    return users.filter(u => u.role === 'manager' || u.role === 'staff').map(u => ({
      id: u.id,
      email: u.email,
      name: u.fullName,
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
        actions: PermissionAction[];
      }[];
    }
  ) {
    const validActions: PermissionAction[] = ['view', 'add', 'edit', 'delete'];

    const isValid = Array.isArray(body.permissions) && body.permissions.every(p =>
      typeof p.section === 'string' &&
      Array.isArray(p.actions) &&
      p.actions.every(action => validActions.includes(action))
    );

    if (!isValid) {
      throw new Error('Invalid permission actions');
    }

    return this.usersService.update(id, {
      permissions: body.permissions,
    });
  }

  @Post()
  async createStaff(
    @Body()
    body: {
      email: string;
      name?: string;
      password: string;
      permissions?: { section: string; actions: PermissionAction[] }[];
    }
  ) {
    if (!body.email?.trim()) throw new BadRequestException('Email là bắt buộc');
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Mật khẩu tối thiểu 6 ký tự');
    }

    const exists = await this.usersService.findByEmail(body.email.trim());
    if (exists) throw new BadRequestException('Email đã tồn tại');

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const created = await this.usersService.create({
      email: body.email.trim(),
      fullName: body.name?.trim() || undefined,
      password: hashedPassword,
      role: 'staff',
      permissions: body.permissions || [],
    });

    return {
      id: created.id,
      email: created.email,
      name: created.fullName,
      fullName: created.fullName,
      permissions: created.permissions || [],
      createdAt: created.createdAt,
    };
  }

  @Put(':id/password')
  async updateStaffPassword(
    @Param('id') id: string,
    @Body() body: { password: string }
  ) {
    if (!body.password || body.password.length < 6) {
      throw new BadRequestException('Mật khẩu tối thiểu 6 ký tự');
    }

    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');

    const hashedPassword = await bcrypt.hash(body.password, 10);
    await this.usersService.update(id, { password: hashedPassword });
    return { success: true };
  }

  @Delete(':id')
  async removeStaff(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    await this.usersService.remove(id);
    return { success: true };
  }
}