/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';
import { User } from '@user/entities/user.entity';

/* DTOs */
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

/* Faker */
import { generatePurchase, generateManyPurchases } from '@faker/purchase.faker';

describe('PurchaseService', () => {
  let service: PurchaseService;
  let repository: Repository<Purchase>;

  let detailRepository: Repository<PurchaseDetail>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseService,
        {
          provide: getRepositoryToken(Purchase),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PurchaseDetail),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<PurchaseService>(PurchaseService);
    repository = module.get<Repository<Purchase>>(getRepositoryToken(Purchase));
    detailRepository = module.get<Repository<PurchaseDetail>>(
      getRepositoryToken(PurchaseDetail),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count purchases services', () => {
    it('should return total purchases not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find purchases services', () => {
    it('should return all purchases not removed with pagination', async () => {
      const mocks = generateManyPurchases(10);
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), 10]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(10);
    });

    it('findOne should return a purchase by id', async () => {
      const mock = generatePurchase(1);
      const id = mock.id;

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(mock)
        .mockResolvedValueOnce({
          ...mock,
          purchaseDetails: [],
        } as Purchase);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toBeDefined();
    });

    it('findOne should throw NotFoundException if purchase not found', async () => {
      const id = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Purchase with ID ${id} not found`);
      }
    });
  });

  describe('create purchase services', () => {
    it('create should return a purchase', async () => {
      const mock = generatePurchase();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(mock as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mock as any);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock as any);
      jest.spyOn(detailRepository, 'create').mockReturnValue([] as any);
      jest.spyOn(detailRepository, 'save').mockResolvedValue([] as any);

      const dto: CreatePurchaseDto = {
        purchaseDate: mock.purchaseDate,
        totalAmount: Number(mock.totalAmount),
        supplier: mock.supplier.id,
      };

      const { statusCode, data, message } = await service.create(dto, userId);
      expect(statusCode).toBe(201);
      expect(data).toBeDefined();
      expect(message).toBe('The Purchase was created');
    });
  });

  describe('update purchase services', () => {
    it('update should return a purchase', async () => {
      const mock = generatePurchase();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdatePurchaseDto = { totalAmount: 100 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(mock)
        .mockResolvedValueOnce(mock);

      const { statusCode, data, message } = await service.update(
        id,
        userId,
        changes,
      );
      expect(statusCode).toBe(200);
      expect(data).toBeDefined();
      expect(message).toBe(`The Purchase with id: ${id} has been modified`);
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
