/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
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
    it('findAll should return all payment methods with pagination', async () => {
      const paymentMethods = generateManyPaymentMethods(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([
          paymentMethods.slice(0, 10),
          paymentMethods.length,
        ]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { isDeleted: false },
        order: { name: 'ASC' },
        relations: ['createdBy', 'updatedBy'],
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(paymentMethods.length);
      expect(data).toEqual(paymentMethods.slice(0, 10));
    });

    it('findOne should return a payment methods', async () => {
      const paymentMethod = generatePaymentMethod();
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

    it('findOne should throw NotFoundException if payment methods does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Payment Method with ID: ${id} not found`,
        );
      }
    });

    it('findOne should throw NotFoundException if payment methods does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Payment Method with ID: ${id} not found`),
      );
    });
  });

  describe('create payment methods services', () => {
    it('create should return a Payment Method', async () => {
      const paymentMethod = generatePaymentMethod();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(paymentMethod);
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);

      const { statusCode, data } = await service.create(paymentMethod, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(paymentMethod);
    });

    it('create should return Conflict Exception when name Payment Method exists', async () => {
      const paymentMethod = generatePaymentMethod();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(paymentMethod);
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);

      try {
        await service.create(paymentMethod, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          `Payment Method ${paymentMethod.name} already exists`,
        );
      }
    });
  });

  describe('update payment methods services', () => {
    it('update should return message: have been modified', async () => {
      const paymentMethod = generatePaymentMethod();
      const id = paymentMethod.id;
      const userId: User['id'] = 1;
      const changes: UpdatePaymentMethodDto = { name: 'newName' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...paymentMethod, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Payment Method with ID: ${id} has been modified`,
      );
    });

    it('update should throw NotFoundException if Payment Method does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Payment Method with ID: ${id} not found`,
        );
      }
    });
  });

  describe('remove payment methods services', () => {
    it('remove should return status and message', async () => {
      const paymentMethod = generatePaymentMethod();
      const id = paymentMethod.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(paymentMethod);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...paymentMethod, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(paymentMethod);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(
        `The Payment Method with ID: ${id} has been deleted`,
      );
    });

    it('remove should throw NotFoundException if Payment Method does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Payment Method with ID: ${id} not found`),
      );
    });
  });
});
