import { Test, TestingModule } from '@nestjs/testing';

/* Controllers */
import { AuthController } from './auth.controller';

/* Services */
import { AuthService } from './auth.service';

/* Faker */
import { faker } from '@faker-js/faker';

const jwt = faker.internet.jwt();

const mockService = {
  login: jest.fn().mockReturnValue(jwt),
  loginCustomer: jest.fn().mockReturnValue(jwt),
  refreshToken: jest.fn().mockReturnValue(jwt),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });
});
