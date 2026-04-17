/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { PurchaseDetailService } from './purchase-detail.service';

/* Entity */
import { PurchaseDetail } from './entities/purchase-detail.entity';

/* Faker */
import {
  generatePurchaseDetail,
  generateManyPurchaseDetails,
} from '@faker/purchaseDetail.faker';

describe('PurchaseDetailService', () => {
  let service: PurchaseDetailService;
  let repository: Repository<PurchaseDetail>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseDetailService,
        {
          provide: getRepositoryToken(PurchaseDetail),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<PurchaseDetailService>(PurchaseDetailService);
    repository = module.get<Repository<PurchaseDetail>>(
      getRepositoryToken(PurchaseDetail),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count purchase details services', () => {
    it('should return total all purchase details', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total purchase details not removed', async () => {
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

  describe('find purchase details services', () => {
    it('should return all puchase details', async () => {
      const mocks = generateManyPurchaseDetails(5);
      jest.spyOn(repository, 'findAndCount').mockResolvedValue([mocks, 5]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mocks);
      expect(result.total).toBe(5);
    });

    it('findOne should return a sale detail', async () => {
      const mock = generatePurchaseDetail();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if purchase detail does not exist', async () => {
      const id = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Purchase Detail with ID ${id} not found`,
        );
      }
    });

    it('should return purchase details by purchase id', async () => {
      const purchaseId = 1;
      const mocks = generateManyPurchaseDetails(3);
      jest.spyOn(repository, 'find').mockResolvedValue(mocks);

      const { statusCode, data } = await service.findByPurchaseId(purchaseId);
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        where: { purchase: { id: purchaseId }, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });

    it('should return empty array when no purchase details found for purchase id', async () => {
      const purchaseId = 999;
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const { statusCode, data } = await service.findByPurchaseId(purchaseId);
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('create purchase detail services', () => {
    it('create should return a purchase details array', async () => {
      const mocks = generateManyPurchaseDetails(5);

      const mockNewPurchaseDetails = mocks.map((mock) => ({
        ...mock,
        purchase: mock.purchase.id,
        product: mock.product.id,
      }));

      jest.spyOn(repository, 'create').mockReturnValue(mocks as any);
      jest.spyOn(repository, 'save').mockResolvedValue(mocks as any);

      const { statusCode, data } = await service.create(mockNewPurchaseDetails);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mocks);
    });
  });

  describe('update purchase detail services', () => {
    it('update should return a purchase detail', async () => {
      const mock = generatePurchaseDetail();
      const id = mock.id;
      const changes = { quantity: 2 };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data, message } = await service.update(id, changes);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
      expect(message).toBe(
        `The Purchase Detail with id: ${id} has been modified`,
      );
    });

    it('update should throw NotFoundException if Purchase Detail does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, { quantity: 2 });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Purchase Detail with ID ${id} not found`,
        );
      }
    });
  });

  describe('remove purchase details services', () => {
    it('remove should return status and message', async () => {
      const mock = generatePurchaseDetail();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Purchase Detail with ID: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Purchase Detail does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrowError(
        new NotFoundException(`The Purchase Detail with ID ${id} not found`),
      );
    });
  });
});
