/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { ShipmentService } from './shipment.service';

/* Entity */
import { Shipment } from './entities/shipment.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateShipmentDto } from './dto/update-shipment.dto';

/* Faker */
import {
  generateShipment,
  generateManyShipments,
  createShipment,
} from '@faker/shipment.faker';
import { CreateShipmentDto } from './dto/create-shipment.dto';

describe('ShipmentService', () => {
  let service: ShipmentService;
  let repository: Repository<Shipment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShipmentService,
        {
          provide: getRepositoryToken(Shipment),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<ShipmentService>(ShipmentService);
    repository = module.get<Repository<Shipment>>(getRepositoryToken(Shipment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count Shipments services', () => {
    it('should return total all Shipments', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total Shipments not removed', async () => {
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

  describe('find shipments services', () => {
    it('findAll should return all shipments with pagination', async () => {
      const mocks = generateManyShipments(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

      const { statusCode, data, meta } = await service.findAll();
      expect(repository.findAndCount).toHaveBeenCalledTimes(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
        where: {
          isDeleted: false,
        },
        order: {
          shipmentDate: 'DESC',
        },
        skip: 0,
        take: 10,
      });
      expect(statusCode).toBe(200);
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findAllByShippingCompanyId should return all shipments by shipping company id', async () => {
      const mocks = generateManyShipments(50);
      const shippingCompanyId = mocks[0].shippingCompany.id;

      jest.spyOn(repository, 'find').mockResolvedValue(mocks);

      const { statusCode, data } =
        await service.findAllByShippingCompanyId(shippingCompanyId);
      expect(repository.find).toHaveBeenCalledTimes(1);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
        where: { shippingCompany: { id: shippingCompanyId }, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mocks);
    });

    it('findOne should return one shipment', async () => {
      const mock = generateShipment();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if shipment does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Shipment with ID: ${id} not found`);
      }
    });

    it('findOneByTrackingNumber should return one shipment', async () => {
      const mock = generateShipment();
      const trackingNumber = mock.trackingNumber;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } =
        await service.findOneByTrackingNumber(trackingNumber);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
        where: { trackingNumber, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOneByTrackingNumber should throw NotFoundException if shipment does not exist', async () => {
      const trackingNumber = '123456';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneByTrackingNumber(trackingNumber);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Shipment with tracking number: ${trackingNumber} not found`,
        );
      }
    });

    it('findOneBySaleId should return one shipment', async () => {
      const mock = generateShipment();
      const saleId = mock.sale.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOneBySaleId(saleId);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['sale', 'shippingCompany', 'createdBy', 'updatedBy'],
        where: { sale: { id: saleId }, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOneBySaleId should throw NotFoundException if shipment does not exist', async () => {
      const saleId = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneBySaleId(saleId);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(
          `The Shipment with sale ID: ${saleId} not found`,
        );
      }
    });
  });

  describe('create shipments services', () => {
    it('should create a shipment', async () => {
      const mock = generateShipment();
      const userId: User['id'] = 1;
      const newShipment: CreateShipmentDto = {
        ...mock,
        sale: mock.sale.id,
        shippingCompany: mock.shippingCompany.id,
      };

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data, message } = await service.create(
        newShipment,
        userId,
      );
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
      expect(message).toBe('The Shipment was created');
    });
  });

  describe('update products services', () => {
    it('update should return a Shipment', async () => {
      const mock = generateShipment();
      const id = mock.id;
      const userId: User['id'] = 1;
      const changes: UpdateShipmentDto = createShipment();

      jest.spyOn(service, 'findOne').mockResolvedValue({
        statusCode: 200,
        data: mock,
      });
      jest.spyOn(repository, 'merge').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data, message } = await service.update(
        id,
        userId,
        changes,
      );
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(repository.save).toHaveBeenCalledWith(mock);
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
      expect(message).toBe(`The Shipment with id: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Shipment does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { shippingCompany: 5 });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Shipment with ID: ${id} not found`);
      }
    });
  });

  describe('remove shipments services', () => {
    it('remove should return status and message', async () => {
      const mock = generateShipment();
      const id = mock.id;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...mock, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Shipment with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Shipment does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Shipment with ID: ${id} not found`),
      );
    });
  });
});
