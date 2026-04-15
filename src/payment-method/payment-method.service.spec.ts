/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { PaymentMethodService } from '@payment_method/payment-method.service';

/* Entity */
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';

/* Faker */
import {
  generatePaymentMethod,
  generateManyPaymentMethods,
} from '@faker/paymentMethod.faker';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let repository: Repository<PaymentMethod>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<PaymentMethodService>(PaymentMethodService);
    repository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count payment methods services', () => {
    it('should return total all payment methods', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total payment methods not removed', async () => {
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

  describe('find payment methods services', () => {
    it('findAll should return all payment methods with pagination as ResponsePaymentMethodDto', async () => {
      const paymentMethods = generateManyPaymentMethods(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([paymentMethods, paymentMethods.length]);

      const result = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(result.statusCode).toBe(200);
      expect(result.meta.total).toEqual(paymentMethods.length);
      // Verify data is mapped to ResponsePaymentMethodDto
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).not.toHaveProperty('createdBy');
    });

    it('findOne should return a payment method as ResponsePaymentMethodDto', async () => {
      const paymentMethod = generatePaymentMethod(1);
      const id = paymentMethod.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);

      const result = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(result.statusCode).toBe(200);
      // Verify data is ResponsePaymentMethodDto, not PaymentMethod entity
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).not.toHaveProperty('createdBy');
    });

    it('findOne should throw NotFoundException if payment method does not exist', async () => {
      const id = 99999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Payment Method with ID: ${id} not found`),
      );
    });
  });

  describe('create payment methods services', () => {
    it('create should return a Payment Method as ResponsePaymentMethodDto', async () => {
      const paymentMethod = generatePaymentMethod(1);
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(paymentMethod);
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);
      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);

      const result = await service.create(paymentMethod, userId);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalled(); // Re-fetch for relations
      expect(result.statusCode).toBe(201);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      expect(result.message).toBe('The Payment Method was created');
    });
  });

  describe('update payment methods services', () => {
    it('update should return message: have been modified', async () => {
      const paymentMethod = generatePaymentMethod(1);
      const id = paymentMethod.id;
      const userId: User['id'] = 1;
      const changes: UpdatePaymentMethodDto = { name: 'New Name' };

      const updatedPaymentMethod = { ...paymentMethod, ...changes };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(paymentMethod) // First call in update method
        .mockResolvedValueOnce(updatedPaymentMethod); // Second call for re-fetch after save
      jest.spyOn(repository, 'merge').mockReturnValue(updatedPaymentMethod);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedPaymentMethod);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(2);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Payment Method with ID: ${id} has been modified`,
      );
    });

    it('update should throw NotFoundException if Payment Method does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.update(id, userId, { name: 'newName' }),
      ).rejects.toThrowError(
        new NotFoundException(`The Payment Method with ID: ${id} not found`),
      );
    });
  });

  describe('remove payment methods services', () => {
    it('remove should return status and message', async () => {
      const paymentMethod = generatePaymentMethod(1);
      const id = paymentMethod.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...paymentMethod, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);

      const { statusCode, message } = await service.remove(id, userId);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Payment Method with ID: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Payment Method does not exist', async () => {
      const id = 99999;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Payment Method with ID: ${id} not found`),
      );
    });
  });
});
