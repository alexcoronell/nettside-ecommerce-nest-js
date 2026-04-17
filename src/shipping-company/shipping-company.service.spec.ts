/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ShippingCompanyService } from './shipping-company.service';

/* Entity */
import { ShippingCompany } from './entities/shipping-company.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateShippingCompanyDto } from './dto/update-shipping-company.dto';

/* Faker */
import {
  generateShippingCompany,
  generateManyShippingCompanies,
} from '@faker/shippingCompany.faker';

describe('ShippingCompanyService', () => {
  let service: ShippingCompanyService;
  let repository: Repository<ShippingCompany>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingCompanyService,
        {
          provide: getRepositoryToken(ShippingCompany),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ShippingCompanyService>(ShippingCompanyService);
    repository = module.get<Repository<ShippingCompany>>(
      getRepositoryToken(ShippingCompany),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapEntityToResponse', () => {
    it('should map entity to response DTO', () => {
      const entity: ShippingCompany = {
        id: 1,
        name: 'DHL',
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'contact@dhl.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        isDeleted: false,
        createdBy: { id: 1 } as User,
        updatedBy: { id: 2 } as User,
        deletedBy: null,
        shipments: [],
      };

      const response = service.mapEntityToResponse(entity);

      expect(response).toEqual({
        id: 1,
        name: 'DHL',
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'contact@dhl.com',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        deletedAt: null,
        deletedBy: null,
        createdBy: 1,
        updatedBy: 2,
      });
    });

    it('should handle null relations', () => {
      const entity = {
        id: 1,
        name: 'DHL',
        contactName: 'John',
        phoneNumber: '+123',
        email: 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
        createdBy: null,
        updatedBy: null,
        deletedBy: null,
        shipments: [],
      } as unknown as ShippingCompany;

      const response = service.mapEntityToResponse(entity);

      expect(response.createdBy).toBeNull();
      expect(response.updatedBy).toBeNull();
    });
  });

  describe('count shipping companies services', () => {
    it('should return total shipping companies not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);
      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find shipping companies services', () => {
    it('findAll should return ResponseShippingCompanyDto[] with pagination', async () => {
      const mocks = generateManyShippingCompanies(50);
      mocks.forEach((m) => {
        m.createdBy = { id: 1 } as User;
        m.updatedBy = { id: 2 } as User;
      });

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toHaveLength(10);
    });

    it('findOne should return ResponseShippingCompanyDto', async () => {
      const shippingCompany = generateShippingCompany();
      shippingCompany.createdBy = { id: 1 } as User;
      shippingCompany.updatedBy = { id: 2 } as User;
      const id = shippingCompany.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(shippingCompany);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy', 'deletedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          id: shippingCompany.id,
          name: shippingCompany.name,
        }),
      );
    });

    it('findOne should throw NotFoundException if shipping companies does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Shipping Company with ID: ${id} not found`,
        );
      }
    });
  });

  describe('create shipping companies services', () => {
    it('create should return ResponseShippingCompanyDto', async () => {
      const shippingCompany = generateShippingCompany();
      shippingCompany.createdBy = { id: 1 } as User;
      shippingCompany.updatedBy = { id: 1 } as User;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(shippingCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(shippingCompany);
      jest.spyOn(repository, 'findOne').mockResolvedValue(shippingCompany);

      const { statusCode, data, message } = await service.create(
        shippingCompany,
        userId,
      );
      expect(statusCode).toBe(201);
      expect(message).toBe('The Shipping Company was created');
      expect(data).toEqual(
        expect.objectContaining({
          id: shippingCompany.id,
        }),
      );
    });
  });

  describe('update shipping companies services', () => {
    it('update should return message and ResponseShippingCompanyDto', async () => {
      const shippingCompany = generateShippingCompany();
      shippingCompany.createdBy = { id: 1 } as User;
      shippingCompany.updatedBy = { id: 2 } as User;
      const id = shippingCompany.id;
      const userId: User['id'] = 1;
      const changes: UpdateShippingCompanyDto = { name: 'newName' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(shippingCompany);
      jest.spyOn(repository, 'merge').mockReturnValue(shippingCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(shippingCompany);

      const { statusCode, message, data } = await service.update(
        id,
        userId,
        changes,
      );
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Shipping Company with ID: ${id} has been modified`,
      );
      expect(data).toEqual(
        expect.objectContaining({
          id: shippingCompany.id,
        }),
      );
    });

    it('update should throw NotFoundException if Shipping Company does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Shipping Company with ID: ${id} not found`,
        );
      }
    });
  });

  describe('remove shipping companies services', () => {
    it('remove should return statusCode and message', async () => {
      const shippingCompany = generateShippingCompany();
      shippingCompany.createdBy = { id: 1 } as User;
      shippingCompany.updatedBy = { id: 2 } as User;
      const id = shippingCompany.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(shippingCompany);
      jest.spyOn(repository, 'merge').mockReturnValue(shippingCompany);
      jest.spyOn(repository, 'save').mockResolvedValue(shippingCompany);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Shipping Company with ID: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Shipping Company does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Shipping Company with ID: ${id} not found`),
      );
    });
  });
});
