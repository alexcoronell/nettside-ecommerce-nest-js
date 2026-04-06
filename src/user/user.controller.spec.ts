/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { UserController } from './user.controller';

/* Services */
import { UserService } from './user.service';

/* DTO's */
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password-user';

/* Faker */
import {
  createUser,
  generateUser,
  generateManyUsers,
  generateManyCustomers,
} from '@faker/user.faker';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = generateUser();
  const mockUsers = generateManyUsers(10).map((user) => {
    user.password = undefined;
    return user;
  });
  const mockCustomers = generateManyCustomers(10).map((user) => {
    user.password = undefined;
    return user;
  });

  const mockNewUser: CreateUserDto = createUser();
  const mockUserService = {
    countAll: jest.fn().mockResolvedValue(mockUsers.length),
    count: jest.fn().mockResolvedValue(mockUsers.length),
    countCustomers: jest.fn().mockResolvedValue(mockCustomers.length),
    findAll: jest.fn().mockResolvedValue(mockUsers),
    findAllSellers: jest.fn().mockResolvedValue(mockUsers),
    findAllCustomers: jest.fn().mockResolvedValue(mockUsers),
    findOne: jest.fn().mockResolvedValue(mockUser),
    findOneWithoutRelations: jest.fn().mockResolvedValue(mockUser),
    findOneByEmail: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockNewUser),
    register: jest.fn().mockResolvedValue(mockNewUser),
    update: jest.fn().mockResolvedValue(1),
    updatePassword: jest.fn().mockResolvedValue(1),
    remove: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count users controllers', () => {
    it('should call count user service', async () => {
      expect(await controller.count()).toBe(mockUsers.length);
      expect(service.count).toHaveBeenCalledTimes(1);
    });

    it('should call count customer in user service', async () => {
      expect(await controller.countCustomers()).toBe(mockCustomers.length);
      expect(service.countCustomers).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find users controllers', () => {
    it('should call findAll user service', async () => {
      expect(await controller.findAll()).toBe(mockUsers);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne user service', async () => {
      expect(await controller.findOne(1)).toBe(mockUser);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return an user by email', async () => {
      expect(await controller.findOneByEmail(mockUser.email));
      expect(service.findOneByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('create user controller', () => {
    it('should call create user service', async () => {
      const userId = 1;
      await controller.create(mockNewUser, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should call register customer service', async () => {
      await controller.register(mockNewUser);
      expect(service.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('update user controller', () => {
    it('should call update user service', async () => {
      const userId = 1;
      const changes: UpdateUserDto = { firstname: 'newFirstname' };
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should call update password user service', async () => {
      const newPassword: UpdatePasswordDto = { password: 'newPassword' };
      await controller.updatePassword(1, newPassword);
      expect(service.updatePassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove user controller', () => {
    it('shoudl call remove user service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
