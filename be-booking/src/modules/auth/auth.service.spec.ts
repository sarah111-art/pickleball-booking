import { AuthService } from './auth.service';

describe('AuthService', () => {
  let svc: AuthService;

  const fakeUsers = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
  } as any;

  const fakeJwt = { sign: jest.fn().mockReturnValue('token') } as any;
  const fakeConfig = { get: jest.fn().mockReturnValue(undefined) } as any;

  beforeEach(() => {
    svc = new AuthService(fakeUsers, fakeJwt, fakeConfig);
  });

  it('register should create user and return token', async () => {
    fakeUsers.findByEmail.mockResolvedValueOnce(null);
    fakeUsers.create.mockResolvedValueOnce({ id: 1, email: 'a@b.com', role: 'user' });
    const r = await svc.register({ email: 'a@b.com', password: 'x' });
    expect(r).toHaveProperty('accessToken');
    expect(fakeUsers.create).toHaveBeenCalled();
  });
});
