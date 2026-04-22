import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

/* Services */
import { SupplierService } from './supplier.service';

/* Entity */
import { Supplier } from './entities/supplier.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

/* Faker */
import { generateSupplier, generateManySuppliers } from '@faker/supplier.faker';

/* Mapper */
import {
  mapSupplierToResponseDto,
  mapSuppliersToResponseDto,
} from './mappers/supplier.mapper';

describe('SupplierService', () => {
  let service: SupplierService;

  const mockSupplier: Supplier = generateSupplier();
  const mockSuppliers: Supplier[] = generateManySuppliers(10);

  const createMockRepo = () => ({
    count: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
  });

  let mockRepository: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    mockRepository = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count', () => {
    it('should return total suppliers not removed', async () => {
      mockRepository.count.mockResolvedValue(100);
      const { statusCode, total } = await service.count();
      expect(mockRepository.count).toHaveBeenCalledTimes(1);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('findAllNoPagination', () => {
    it('should return all supplier names without pagination', async () => {
      const suppliersWithNames = mockSuppliers.map((s) => ({
        id: s.id,
        name: s.name,
      }));
      mockRepository.find.mockResolvedValue(suppliersWithNames);

      const { statusCode, data } = await service.findAllNoPagination();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        select: ['id', 'name'],
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(suppliersWithNames);
    });

    it('should return empty array when no suppliers exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const { statusCode, data } = await service.findAllNoPagination();
      expect(statusCode).toBe(200);
      expect(data).toEqual([]);
    });

    it('should handle find errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAllNoPagination()).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should return all suppliers with default pagination', async () => {
      const expectedMappedSuppliers = mapSuppliersToResponseDto(mockSuppliers);

      mockRepository.findAndCount.mockResolvedValue([
        mockSuppliers,
        mockSuppliers.length,
      ]);

      const { statusCode, data, meta } = await service.findAll();
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        relations: ['createdBy', 'updatedBy', 'deletedBy'],
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(expectedMappedSuppliers);
      expect(meta.total).toEqual(mockSuppliers.length);
    });

    it('should apply custom pagination', async () => {
      const { page, limit } = { page: 2, limit: 5 };
      mockRepository.findAndCount.mockResolvedValue([
        mockSuppliers.slice(0, 5),
        5,
      ]);

      const result = await service.findAll({ page, limit });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.statusCode).toBe(200);
    });

    it('should handle findAndCount errors', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('DB error'));
      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  describe('findOne', () => {
    it('should return a supplier', async () => {
      const expectedMappedSupplier = mapSupplierToResponseDto(mockSupplier);

      mockRepository.findOne.mockResolvedValue(mockSupplier);

      const { statusCode, data } = await service.findOne(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy', 'deletedBy'],
        where: { id: 1, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(expectedMappedSupplier);
    });

    it('should throw NotFoundException if Supplier does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow(
        'The Supplier with ID: 42 not found',
      );
    });

    it('should handle findOne errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.findOne(1)).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('should create a supplier', async () => {
      const dto: CreateSupplierDto = {
        name: 'Test Supplier',
        contactName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
      };
      const userId: User['id'] = 1;
      const savedSupplier = { id: 1, ...dto, isDeleted: false };

      mockRepository.create.mockReturnValue({ ...dto });
      mockRepository.save.mockResolvedValue(savedSupplier);
      mockRepository.findOne.mockResolvedValue(savedSupplier);

      const { statusCode, message } = await service.create(dto, userId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: { id: userId },
        updatedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalled(); // For fetching with relations
      expect(statusCode).toBe(201);
      expect(message).toBe('The Supplier was created');
    });

    it('should handle create errors', async () => {
      mockRepository.create.mockReturnValue(mockSupplier);
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.create(
          {
            name: 'Test',
            contactName: 'John',
            phoneNumber: '+123',
            email: 'test@test.com',
          },
          1,
        ),
      ).rejects.toThrow('DB error');
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const changes: UpdateSupplierDto = { name: 'Updated Name' };
      const userId: User['id'] = 1;
      const updatedSupplier = { ...mockSupplier, ...changes };

      // First findOne call (findOneEntity to get the supplier)
      mockRepository.findOne.mockResolvedValueOnce(mockSupplier);
      // Second findOne call (after save to fetch with relations)
      mockRepository.findOne.mockResolvedValueOnce(updatedSupplier);
      mockRepository.merge.mockReturnValue(updatedSupplier);
      mockRepository.save.mockResolvedValue(updatedSupplier);

      const { statusCode, message } = await service.update(1, userId, changes);
      expect(mockRepository.merge).toHaveBeenCalledWith(mockSupplier, {
        ...changes,
        updatedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(statusCode).toBe(200);
      expect(message).toBe('The Supplier with ID: 1 has been modified');
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, 1, { name: 'test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle update errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.update(1, 1, { name: 'test' })).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a supplier', async () => {
      const userId: User['id'] = 1;

      mockRepository.findOne.mockResolvedValue(mockSupplier);
      mockRepository.merge.mockReturnValue({
        ...mockSupplier,
        isDeleted: true,
      });
      mockRepository.save.mockResolvedValue({
        ...mockSupplier,
        isDeleted: true,
      });

      const { statusCode, message } = await service.remove(1, userId);
      expect(mockRepository.merge).toHaveBeenCalledWith(mockSupplier, {
        isDeleted: true,
        deletedBy: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(statusCode).toBe(200);
      expect(message).toBe('The Supplier with ID: 1 has been deleted');
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should handle remove errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.remove(1, 1)).rejects.toThrow('DB error');
    });
  });
});
