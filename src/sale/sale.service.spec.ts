/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { SaleService } from './sale.service';

/* Entity */
import { Sale } from './entities/sale.entity';
import { SaleDetail } from '@sale_detail/entities/sale-detail.entity';

/* Faker */
import { generateSale, generateManySales } from '@faker/sale.faker';
import { generateUser } from '@faker/user.faker';
import { generatePaymentMethod } from '@faker/paymentMethod.faker';

describe('SaleService', () => {
  let service: SaleService;
  let repository: Repository<Sale>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: getRepositoryToken(Sale),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SaleDetail),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<SaleService>(SaleService);
    repository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count sales services', () => {
    it('should return total all sales', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total sales not removed', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);
      const { statusCode, total } = await service.count();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(repository.count).toHaveBeenCalledWith({
        where: { isCancelled: false },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });
  });

  describe('find sales services', () => {
    it('should return all sales', async () => {
      const mocks = generateManySales(10);
      // Add required relations
      mocks.forEach((mock) => {
        mock.user = generateUser();
        mock.paymentMethod = generatePaymentMethod();
      });
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const result = await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.total).toEqual(mocks.length);
      // Verify data array is returned correctly
      expect(result.data).toBeDefined();
      const dataArray = result.data as any[];
      expect(dataArray).toHaveLength(10);
    });

    it('should return all sales by User id', async () => {
      const userId = 1;
      const mocks = generateManySales(10);
      mocks.forEach((mock) => {
        mock.user = generateUser();
        mock.paymentMethod = generatePaymentMethod();
      });
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } = await service.findAllByUser(userId);

      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: userId }, isCancelled: false },
        relations: ['user', 'paymentMethod'],
        order: { saleDate: 'DESC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toHaveLength(10);
    });

    it('should return all sales by payment method id', async () => {
      const paymentMethodId = 1;
      const mocks = generateManySales(10);
      mocks.forEach((mock) => {
        mock.user = generateUser();
        mock.paymentMethod = generatePaymentMethod();
      });
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks, mocks.length]);

      const { statusCode, data, total } =
        await service.findAllByPaymentMethod(paymentMethodId);

      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { paymentMethod: { id: paymentMethodId }, isCancelled: false },
        relations: ['user', 'paymentMethod'],
        order: { saleDate: 'DESC' },
      });
      expect(statusCode).toBe(200);
      expect(total).toEqual(mocks.length);
      expect(data).toHaveLength(10);
    });

    it('should return a sale by id', async () => {
      const mock = generateSale();
      mock.user = generateUser();
      mock.paymentMethod = generatePaymentMethod();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, isCancelled: false },
        relations: ['user', 'paymentMethod'],
      });
      expect(statusCode).toBe(200);
      // Verify ResponseSaleDto structure
      expect(data).toEqual(
        expect.objectContaining({
          id: mock.id,
          totalAmount: mock.totalAmount,
          shippingAddress: mock.shippingAddress,
          status: mock.status,
          isCancelled: mock.isCancelled,
        }),
      );
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      const id = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`Sale with ID ${id} not found`),
      );
    });
  });

  describe('create sale service', () => {
    it('should create a new sale', async () => {
      const mock = generateSale();
      mock.user = generateUser();
      mock.paymentMethod = generatePaymentMethod();
      const createdBy: number = 1;

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const dto = {
        totalAmount: mock.totalAmount,
        shippingAddress: mock.shippingAddress,
        paymentMethod: mock.paymentMethod.id,
      };

      const { statusCode, data } = await service.create(dto, createdBy);
      expect(statusCode).toBe(201);
      expect(data).toEqual(
        expect.objectContaining({
          totalAmount: mock.totalAmount,
          shippingAddress: mock.shippingAddress,
        }),
      );
    });
  });

  describe('cancel sale service', () => {
    it('should cancel a sale by id', async () => {
      const mock = generateSale();
      mock.user = generateUser();
      mock.paymentMethod = generatePaymentMethod();
      const id = mock.id;
      const userId = 1;

      // Mock findOne to return the sale (first call in findOne)
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      // Mock merge to return the merged entity
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isCancelled: true } as Sale);
      // Mock save to return the cancelled sale
      jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ ...mock, isCancelled: true });

      const { statusCode, message } = await service.cancel(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toBe(`Sale with ID: ${id} cancelled successfully`);
    });

    it('should throw NotFoundException if sale does not exist', async () => {
      const id = 999;
      const userId = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.cancel(id, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
