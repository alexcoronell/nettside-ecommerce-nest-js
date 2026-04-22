/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';

/* Controller */
import { SupplierController } from './supplier.controller';

/* Services */
import { SupplierService } from './supplier.service';

/* Entities */
import { Supplier } from './entities/supplier.entity';

/* DTO's */
import { CreateSupplierDto } from './dto/create-supplier.dto';

/* Faker */
import {
  createSupplier,
  generateSupplier,
  generateManySuppliers,
} from '@faker/supplier.faker';

describe('SupplierController', () => {
  let controller: SupplierController;
  let service: SupplierService;

  const mockSupplier: Supplier = generateSupplier();
  const mockSuppliers: Supplier[] = generateManySuppliers(10);
  const mockNewSupplier: CreateSupplierDto = createSupplier();

  const mockService = {
    count: jest.fn().mockResolvedValue(mockSuppliers.length),
    findAll: jest.fn().mockResolvedValue(mockSuppliers),
    findAllNoPagination: jest.fn().mockResolvedValue(mockSuppliers),
    findOne: jest.fn().mockResolvedValue(mockSupplier),

    create: jest.fn().mockResolvedValue(mockNewSupplier),
    update: jest.fn().mockResolvedValue(1),
    remove: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierController],
      providers: [
        {
          provide: SupplierService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SupplierController>(SupplierController);
    service = module.get<SupplierService>(SupplierService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Count supplier controllers', () => {
    it('should call count supplier service', async () => {
      expect(await controller.count()).toBe(mockSuppliers.length);
      expect(service.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('Find suppliers controllers', () => {
    it('should call findAll supplier service', async () => {
      expect(await controller.findAll()).toBe(mockSuppliers);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should call findAllNoPagination supplier service', async () => {
      expect(await controller.findAllNoPagination()).toBe(mockSuppliers);
      expect(service.findAllNoPagination).toHaveBeenCalledTimes(1);
    });

    it('should call findOne supplier service', async () => {
      expect(await controller.findOne(1)).toBe(mockSupplier);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('create supplier controller', () => {
    it('should call create supplier service', async () => {
      const userId = 1;
      await controller.create(mockNewSupplier, userId);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update supplier controller', () => {
    it('should call update supplier service', async () => {
      const changes = { name: 'newName' };
      const userId = 1;
      await controller.update(1, userId, changes);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove supplier controller', () => {
    it('shoudl call remove supplier service', async () => {
      const userId = 1;
      await controller.remove(1, userId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});
