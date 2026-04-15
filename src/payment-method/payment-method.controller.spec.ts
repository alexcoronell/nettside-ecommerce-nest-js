/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

/* Controller */
import { PaymentMethodController } from '@payment_method/payment-method.controller';

/* Services */
import { PaymentMethodService } from '@payment_method/payment-method.service';

/* DTO's */
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '@payment_method/dto/update-payment-method.dto';
import { ResponsePaymentMethodDto } from '@payment_method/dto/response-payment-method.dto';

/* Faker */
import {
  createPaymentMethod,
  generateManyPaymentMethods,
} from '@faker/paymentMethod.faker';

describe('PaymentMethodController', () => {
  let controller: PaymentMethodController;
  let service: PaymentMethodService;

  const mockResponsePaymentMethod: ResponsePaymentMethodDto = {
    id: 1,
    name: 'Credit Card',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };

  const mockPaymentMethods = generateManyPaymentMethods(10);
  const mockNewPaymentMethod: CreatePaymentMethodDto = createPaymentMethod();

  const countAllResponse = {
    statusCode: HttpStatus.OK,
    total: mockPaymentMethods.length,
  };
  const countResponse = {
    statusCode: HttpStatus.OK,
    total: mockPaymentMethods.length,
  };
  const findAllResponse = {
    statusCode: HttpStatus.OK,
    data: [mockResponsePaymentMethod],
    meta: { total: 1, page: 1, limit: 10 },
  };
  const findOneResponse = {
    statusCode: HttpStatus.OK,
    data: mockResponsePaymentMethod,
  };
  const createResponse = {
    statusCode: HttpStatus.CREATED,
    data: mockResponsePaymentMethod,
    message: 'The Payment Method was created',
  };
  const updateResponse = {
    statusCode: HttpStatus.OK,
    data: mockResponsePaymentMethod,
    message: 'The Payment Method with ID: 1 has been modified',
  };
  const removeResponse = {
    statusCode: HttpStatus.OK,
    message: 'The Payment Method with ID: 1 has been deleted',
  };

  const mockService = {
    countAll: jest.fn().mockResolvedValue(countAllResponse),
    count: jest.fn().mockResolvedValue(countResponse),
    findAll: jest.fn().mockResolvedValue(findAllResponse),
    findOne: jest.fn().mockResolvedValue(findOneResponse),
    create: jest.fn().mockResolvedValue(createResponse),
    update: jest.fn().mockResolvedValue(updateResponse),
    remove: jest.fn().mockResolvedValue(removeResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodController],
      providers: [
        {
          provide: PaymentMethodService,
          useValue: mockService as unknown as PaymentMethodService,
        },
      ],
    }).compile();

    controller = module.get<PaymentMethodController>(PaymentMethodController);
    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count payment methods controllers', () => {
    it('should call countAll payment method service', async () => {
      const result = await controller.countAll();
      expect(result).toEqual(countAllResponse);
      expect(service.countAll).toHaveBeenCalledTimes(1);
    });

    it('should call count payment method service', async () => {
      const result = await controller.count();
      expect(result).toEqual(countResponse);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find payment methods controllers', () => {
    it('should call findAll payment method service', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(findAllResponse);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findOne payment method service', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(findOneResponse);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create payment methods controller', () => {
    it('should call create payment method service', async () => {
      const userId = 1;
      const result = await controller.create(mockNewPaymentMethod, userId);
      expect(result).toEqual(createResponse);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockNewPaymentMethod, userId);
    });
  });

  describe('update payment methods controller', () => {
    it('should call update payment methods service', async () => {
      const id = 1;
      const userId = 1;
      const changes: UpdatePaymentMethodDto = { name: 'newName' };
      const result = await controller.update(id, changes, userId);
      expect(result).toEqual(updateResponse);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledWith(id, userId, changes);
    });
  });

  describe('remove payment methods controller', () => {
    it('should call remove payment methods service', async () => {
      const id = 1;
      const userId = 1;
      const result = await controller.remove(id, userId);
      expect(result).toEqual(removeResponse);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledWith(id, userId);
    });
  });
});
