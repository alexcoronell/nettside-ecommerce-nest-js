/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { DiscountService } from '@discount/discount.service';

/* Entity */
import { Discount } from '@discount/entities/discount.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateDiscountDto } from '@discount/dto/update-discount.dto';

/* Faker */
import { generateDiscount, generateManyDiscounts } from '@faker/discount.faker';

describe('DiscountService', () => {
  let service: DiscountService;
  let repository: Repository<Discount>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        {
          provide: getRepositoryToken(Discount),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<DiscountService>(DiscountService);
    repository = module.get<Repository<Discount>>(getRepositoryToken(Discount));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count discounts services', () => {
    it('should return total discounts not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);
      const result = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      expect(result.total).toEqual(100);
    });
  });

  describe('findAllNoPagination discounts services', () => {
    it('should return all discounts with only id and name fields', async () => {
      const discounts = generateManyDiscounts(10);

      jest.spyOn(repository, 'find').mockResolvedValue(discounts);

      const result = await service.findAllNoPagination();
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        select: ['id', 'name'],
      });
      expect(result.statusCode).toBe(200);
      expect(result.data!).toHaveLength(discounts.length);
      expect(result.data![0]).toHaveProperty('id');
      expect(result.data![0]).toHaveProperty('name');
    });

    it('should return empty array when no discounts exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAllNoPagination();
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.data!).toHaveLength(0);
    });
  });

  describe('findAll discounts services', () => {
    it('should return all discounts with pagination', async () => {
      const mocks = generateManyDiscounts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.meta.total).toEqual(mocks.length);
      // Verify data is mapped to ResponseDiscountDto
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
    });
  });

  describe('findOne discounts services', () => {
    it('should return a discount by id as ResponseDiscountDto', async () => {
      const discount = generateDiscount(1);
      const id = discount.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(discount);

      const result = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      // Verify data is ResponseDiscountDto, not Discount entity
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });
  });

  describe('create discounts services', () => {
    it('should create a new discount and return ResponseDiscountDto', async () => {
      const discount = generateDiscount(1);
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(discount);
      jest.spyOn(repository, 'save').mockResolvedValue(discount);
      jest.spyOn(repository, 'findOne').mockResolvedValue(discount);

      const result = await service.create(discount, userId);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalled(); // Re-fetch for relations
      expect(result.statusCode).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.message).toBe('The Discount was created');
    });
  });

  describe('update discounts services', () => {
    it('should update a discount and return ResponseDiscountDto', async () => {
      const discount = generateDiscount(1);
      const id = discount.id;
      const userId: User['id'] = 1;
      const changes: UpdateDiscountDto = { name: 'NEWname' };

      const updatedDiscount = { ...discount, ...changes };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(discount) // First call in update method
        .mockResolvedValueOnce(updatedDiscount); // Second call for re-fetch after save
      jest.spyOn(repository, 'merge').mockReturnValue(updatedDiscount);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedDiscount);

      const result = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toEqual(
        `The Discount with ID: ${id} has been modified`,
      );
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(id, userId, { name: 'newname' }),
      ).rejects.toThrowError(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });
  });

  describe('remove discounts services', () => {
    it('should soft delete a discount', async () => {
      const discount = generateDiscount(1);
      const id = discount.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(discount);
      jest.spyOn(repository, 'merge').mockReturnValue({
        ...discount,
        isDeleted: true,
      });
      jest.spyOn(repository, 'save').mockResolvedValue(discount);

      const result = await service.remove(id, userId);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toEqual(
        `The Discount with ID: ${id} has been deleted`,
      );
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });
  });
});
