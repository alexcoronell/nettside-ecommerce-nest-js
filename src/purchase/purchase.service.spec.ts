/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { PurchaseService } from './purchase.service';

/* Entity */
import { Purchase } from './entities/purchase.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

/* Faker */
import { generatePurchase, generateManyPurchases } from '@faker/purchase.faker';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let repository: Repository<Purchase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: getRepositoryToken(Purchase),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<PurchaseService>(PurchaseService);
    repository = module.get<Repository<Purchase>>(getRepositoryToken(Purchase));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count purchases services', () => {
    it('countAll should return total all purchases', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('count should return total purchases not removed', async () => {
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

  describe('find purchases services', () => {
    it('findAll should return all purchases not removed with pagination', async () => {
      const mocks = generateManyPurchases(10);
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), 10]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { purchaseDate: 'DESC' },
        relations: ['supplier', 'createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks.slice(0, 10));
      expect(meta.total).toEqual(10);
    });

    it('findOne should return a purchase by id', async () => {
      const mock = generatePurchase(1);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(mock.id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mock.id, isDeleted: false },
        relations: ['createdBy'],
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if purchase not found', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`The Purchase with ID ${id} not found`),
      );
    });

    it('findBySupplierId should return purchases by supplier id', async () => {
      const supplierId = 1;
      const mocks = generateManyPurchases(5);
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mocks, 5]);

      const { statusCode, data, total } =
        await service.findBySupplierId(supplierId);
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { supplier: { id: supplierId }, isDeleted: false },
        relations: ['createdBy'],
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
      expect(total).toEqual(5);
    });
  });

  describe('create purchase service', () => {
    it('create should return a Purchase', async () => {
      const mock = generatePurchase();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const mockNewPurchase = {
        ...mock,
        supplier: mock.supplier.id,
      };

      const { statusCode, data } = await service.create(
        mockNewPurchase,
        userId,
      );
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
    });
  });

  describe('update purchase service', () => {
    it('update should return a Purchase', async () => {
      const mock = generatePurchase();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdatePurchaseDto = { totalAmount: 100 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Purchase with id: ${id} has been modified`);
    });

    it('update should throw NotFoundException if purchase not found', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { totalAmount: 100 });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Purchase with ID ${id} not found`);
      }
    });
  });

  describe('remove purchase services', () => {
    it('remove should return status and message', async () => {
      const mock = generatePurchase();
      const userId: User['id'] = 1;
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Purchase with id: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Purchase does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Purchase with ID ${id} not found`),
      );
    });
  });
});
