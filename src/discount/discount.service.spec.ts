/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
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

    it('should return 0 when no discounts exist', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(0);
      const result = await service.count();
      expect(result.total).toEqual(0);
    });
  });

  describe('findAll discounts services', () => {
    it('should return all discounts with pagination default values', async () => {
      const mocks = generateManyDiscounts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { code: 'ASC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(result.statusCode).toBe(200);
      expect(result.meta.total).toEqual(mocks.length);
      expect(result.data).toEqual(mocks.slice(0, 10));
    });

    it('should return discounts with custom pagination', async () => {
      const mocks = generateManyDiscounts(50);
      const paginationDto = { page: 2, limit: 5 };

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(5, 10), mocks.length]);

      const result = await service.findAll(paginationDto);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { code: 'ASC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 5,
        take: 5,
      });
      expect(result.data.length).toBe(5);
    });

    it('should return discounts with search', async () => {
      const mocks = generateManyDiscounts(10);
      const paginationDto = { search: 'DISCOUNT' };

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [
          { isDeleted: false, code: expect.anything() },
          { isDeleted: false, description: expect.anything() },
        ],

        order: { code: 'ASC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
    });

    it('should return discounts with custom sort', async () => {
      const mocks = generateManyDiscounts(10);
      const paginationDto = { sortBy: 'value', sortOrder: 'DESC' as const };

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      await service.findAll(paginationDto);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { value: 'DESC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no discounts found', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await service.findAll();
      expect(result.data).toEqual([]);
      expect(result.meta.total).toEqual(0);
    });
  });

  describe('findOne discounts services', () => {
    it('should return a discount by id', async () => {
      const discount = generateDiscount();
      const id = discount.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(discount);

      const result = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(discount);
    });

    it('should throw NotFoundException if discount does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });

    it('should throw NotFoundException with reject', async () => {
      const id = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Discount with ID: ${id} not found`);
      }
    });
  });

  describe('create discounts services', () => {
    it('should create a new discount', async () => {
      const discount = generateDiscount();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(discount);
      jest.spyOn(repository, 'save').mockResolvedValue(discount);

      const result = await service.create(discount, userId);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(discount);
      expect(result.message).toBe('The Discount was created');
    });

    it('should set createdBy and updatedBy when creating', async () => {
      const discount = generateDiscount();
      const userId = 1;

      jest.spyOn(repository, 'create').mockReturnValue(discount);
      jest.spyOn(repository, 'save').mockResolvedValue(discount);

      await service.create(discount, userId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: { id: userId },
          updatedBy: { id: userId },
        }),
      );
    });
  });

  describe('update discounts services', () => {
    it('should update a discount', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateDiscountDto = { code: 'newCode' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue({ ...mock, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue({ ...mock, ...changes });

      const result = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toEqual(
        `The Discount with ID: ${id} has been modified`,
      );
    });

    it('should update updatedBy when modifying', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId = 2;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      await service.update(id, userId, { code: 'newCode' });
      expect(repository.merge).toHaveBeenCalledWith(
        mock,
        expect.objectContaining({ updatedBy: { id: userId } }),
      );
    });

    it('should throw NotFoundException if discount does not exist on update', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.update(id, userId, { code: 'newCode' }),
      ).rejects.toThrow(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      const discounts = generateManyDiscounts(2);
      const code = discounts[0].code;
      const id = discounts[1].id;
      const userId: User['id'] = 1;
      const changes: UpdateDiscountDto = { code };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(discounts[0]);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(discounts[1]);
      jest.spyOn(repository, 'merge').mockReturnValue(discounts[1]);
      jest.spyOn(repository, 'save').mockResolvedValue(discounts[1]);

      try {
        await service.update(id, userId, changes);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `The Discount CODE: ${code} is already in use`,
        );
      }
    });
  });

  describe('remove discounts services', () => {
    it('should soft delete a discount', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue({
        ...mock,
        isDeleted: true,
        deletedBy: { id: userId } as unknown as User,
        deletedAt: new Date() as unknown as Date,
      });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const result = await service.remove(id, userId);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.message).toEqual(
        `The Discount with ID: ${id} has been deleted`,
      );
    });

    it('should set deletedBy and deletedAt when removing', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId: User['id'] = 3;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      await service.remove(id, userId);

      expect(repository.merge).toHaveBeenCalledWith(
        mock,
        expect.objectContaining({
          isDeleted: true,
          deletedBy: { id: userId } as unknown as User,
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if discount does not exist on remove', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrow(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });
  });
});
