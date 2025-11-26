import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const fakeRepo = {
    create: jest.fn().mockImplementation((p) => p),
    save: jest.fn().mockImplementation((p) => ({ id: 1, ...p })),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 1, email: 'a@b.com' }),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockImplementation((e) => e),
  } as any;

  beforeEach(async () => {
    // construct service directly with mocked repository
    service = new UsersService((fakeRepo as any));
  });

  it('should create a user', async () => {
    const u = await service.create({ email: 'a@b.com' } as any);
    expect(u).toHaveProperty('id');
    expect(fakeRepo.save).toHaveBeenCalled();
  });
});
