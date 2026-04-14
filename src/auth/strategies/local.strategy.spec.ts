import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { LocalAuthStrategy } from '@auth/strategies/implementations/local-auth.strategy';
import { User } from '@user/entities/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  const mockLocalAuthStrategy = {
    validate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: LocalAuthStrategy,
          useValue: mockLocalAuthStrategy,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return user if validation succeeds', async () => {
    const user = { id: 1, email: 'test@test.com', password: undefined } as User;
    mockLocalAuthStrategy.validate.mockResolvedValue(user);

    await expect(strategy.validate('test@test.com', 'pass')).resolves.toEqual(
      user,
    );
    expect(mockLocalAuthStrategy.validate).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass',
    });
  });

  it('should throw UnauthorizedException if validation fails', async () => {
    mockLocalAuthStrategy.validate.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    await expect(strategy.validate('test@test.com', 'wrong')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mockLocalAuthStrategy.validate).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'wrong',
    });
  });
});
