/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { SupplierService } from './supplier.service';

/* Entity */
import { Supplier } from './entities/supplier.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateSupplierDto } from './dto/update-supplier.dto';

/* Faker */
import { generateSupplier, generateManySuppliers } from '@faker/supplier.faker';

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: Repository<Supplier>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<SupplierService>(SupplierService);
    repository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count suppliers services', () => {
    it('should return total all suppliers', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total suppliers not removed', async () => {
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

  describe('find suppliers services', () => {
    it('findAll should return all suppliers with pagination', async () => {
      const suppliers = generateManySuppliers(50);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([suppliers.slice(0, 10), suppliers.length]);

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
      expect(meta.total).toEqual(suppliers.length);
      expect(data).toEqual(suppliers.slice(0, 10));
    });

    it('findOne should return a supplier', async () => {
      const supplier: Supplier = generateSupplier();
      const id = supplier.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(supplier);

      const { statusCode, data } = await service.findOne(id);
      const dataSupplier: Supplier = data as Supplier;
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(dataSupplier).toEqual(supplier);
    });

    it('findOne should throw NotFoundException if Supplier does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Supplier with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if supplier does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Supplier with ID: ${id} not found`),
      );
    });

    it('findOneByName should return a brand', async () => {
      const supplier = generateSupplier();
      const name = supplier.name;

      jest.spyOn(repository, 'findOne').mockResolvedValue(supplier);

      const { statusCode, data } = await service.findOneByName(name);
      const dataSupplier: Supplier = data as Supplier;
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(dataSupplier).toEqual(supplier);
    });

    it('findOneByName should throw NotFoundException if supplier does not exist', async () => {
      const name = 'nameTest';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneByName(name);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Supplier with NAME: ${name} not found`);
      }
    });
  });

  describe('create supplier services', () => {
    it('create should return a supplier', async () => {
      const supplier = generateSupplier();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(supplier);
      jest.spyOn(repository, 'save').mockResolvedValue(supplier);

      const { statusCode, data } = await service.create(supplier, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(supplier);
    });

    it('create should return Conflict Exception when name supplier exists', async () => {
      const supplier = generateSupplier();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(supplier);
      jest.spyOn(repository, 'save').mockResolvedValue(supplier);

      try {
        await service.create(supplier, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`Supplier ${supplier.name} already exists`);
      }
    });
  });

  describe('update supplier services', () => {
    it('update should return message: have been modified', async () => {
      const supplier = generateSupplier();
      const id = supplier.id;
      const userId: User['id'] = 1;

      const changes: UpdateSupplierDto = { name: 'newName' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(supplier);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...supplier, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(supplier);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Supplier with ID: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Supplier does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Supplier with ID: ${id} not found`);
      }
    });
  });

  describe('remove supplier services', () => {
    it('remove should return status and message', async () => {
      const supplier = generateSupplier();
      const id = supplier.id;
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'findOne').mockResolvedValue(supplier);
      jest
        .spyOn(repository, 'merge')
        .mockReturnValue({ ...supplier, isDeleted: true });
      jest.spyOn(repository, 'save').mockResolvedValue(supplier);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Supplier with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if supplier does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Supplier with ID: ${id} not found`),
      );
    });
  });
});
