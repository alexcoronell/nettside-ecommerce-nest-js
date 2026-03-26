/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    it('should return total all discounts', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total discounts not removed', async () => {
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

  describe('find discounts services', () => {
    it('findAll should return all discounts with pagination', async () => {
      const mocks = generateManyDiscounts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { code: 'ASC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findAllWithRelations should return all discounts', async () => {
      const mocks = generateManyDiscounts(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } = await service.findAllWithRelations();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { isDeleted: false },
        order: { code: 'ASC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toEqual(mocks);
    });

    it('findOne should return a discounts', async () => {
      const paymentMethod = generateDiscount();
      const id = paymentMethod.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(paymentMethod);
    });

    it('findOne should throw NotFoundException if discounts does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Discount with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if discounts does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });

    it('findOneByCode should return a discounts', async () => {
      const discount = generateDiscount();
      const code = discount.code;

      jest.spyOn(repository, 'findOne').mockResolvedValue(discount);

      const { statusCode, data } = await service.findOneByCode(code);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(discount);
    });

    it('findOneByCde should throw NotFoundException if Discount does not exist', async () => {
      const code = 'codeTest';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneByCode(code);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Discount with CODE: ${code} not found`);
      }
    });
  });

  describe('create discounts services', () => {
    it('create should return a Discount', async () => {
      const discount = generateDiscount();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockReturnValue(discount);
      jest.spyOn(repository, 'save').mockResolvedValue(discount);

      const { statusCode, data } = await service.create(discount, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(discount);
    });

    it('create should return Conflict Exception when code Discount exists', async () => {
      const mock = generateDiscount();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      try {
        await service.create(mock, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`Discount ${mock.code} already exists`);
      }
    });
  });

  describe('update discounts services', () => {
    it('update should return message: have been modified', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateDiscountDto = { code: 'newCode' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue({ ...mock, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Discount with ID: ${id} has been modified`);
    });

    it('update should return Conflict Exception when code Discount exists', async () => {
      const discounts = generateManyDiscounts(2);
      const code = discounts[0].code;
      const id = discounts[1].id;
      const userId: User['id'] = 1;
      const changes: UpdateDiscountDto = { code };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(discounts[0]);
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

    it('update should throw NotFoundException if Discount does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      try {
        await service.update(id, userId, { code: 'newCode' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Discount with ID: ${id} not found`);
      }
    });
  });

  describe('remove discounts services', () => {
    it('remove should return status and message', async () => {
      const mock = generateDiscount();
      const id = mock.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Discount with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Discount does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Discount with ID: ${id} not found`),
      );
    });
  });
});
