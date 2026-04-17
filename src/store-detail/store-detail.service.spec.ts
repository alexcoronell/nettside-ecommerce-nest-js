/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { StoreDetailService } from './store-detail.service';

/* Entity */
import { StoreDetail } from './entities/store-detail.entity';
import { User } from '@user/entities/user.entity';

/* DTO's */
import { UpdateStoreDetailDto } from './dto/update-store-detail.dto';

/* Faker */
import { generateStoreDetail } from '@faker/storeDetail.faker';

describe('StoreDetailService', () => {
  let service: StoreDetailService;
  let repository: Repository<StoreDetail>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreDetailService,
        {
          provide: getRepositoryToken(StoreDetail),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<StoreDetailService>(StoreDetailService);
    repository = module.get<Repository<StoreDetail>>(
      getRepositoryToken(StoreDetail),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapEntityToResponse', () => {
    it('should map entity to response DTO', () => {
      const entity: StoreDetail = {
        id: 1,
        name: 'Test Store',
        country: 'Colombia',
        state: 'Antioquia',
        city: 'Medellín',
        neighborhood: 'El Poblado',
        address: 'Calle 10 # 20-30',
        phone: '+573001234567',
        email: 'test@store.com',
        legalInformation: 'Some legal info',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: { id: 1 } as User,
        updatedBy: { id: 2 } as User,
      };

      const response = service.mapEntityToResponse(entity);

      expect(response).toEqual({
        id: 1,
        name: 'Test Store',
        country: 'Colombia',
        state: 'Antioquia',
        city: 'Medellín',
        neighborhood: 'El Poblado',
        address: 'Calle 10 # 20-30',
        phone: '+573001234567',
        email: 'test@store.com',
        legalInformation: 'Some legal info',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdBy: 1,
        updatedBy: 2,
      });
    });

    it('should handle null relations', () => {
      const entity: StoreDetail = {
        id: 1,
        name: null,
        country: null,
        state: null,
        city: null,
        neighborhood: null,
        address: null,
        phone: null,
        email: null,
        legalInformation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as StoreDetail;

      const response = service.mapEntityToResponse(entity);

      expect(response.createdBy).toBeNull();
      expect(response.updatedBy).toBeNull();
    });
  });

  describe('find Store Details services', () => {
    it('findOne should return ResponseStoreDetailDto', async () => {
      const mockEntity = generateStoreDetail();
      mockEntity.createdBy = { id: 1 } as User;
      mockEntity.updatedBy = { id: 2 } as User;
      const id = mockEntity.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          id: mockEntity.id,
          name: mockEntity.name,
        }),
      );
    });

    it('findOne should throw NotFoundException if Store Detail does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`Store Details not found`);
      }
    });

    it('findOne should throw NotFoundException if Store Detail does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`Store Details not found`),
      );
    });
  });

  describe('update Store Details services', () => {
    it('update should return ResponseStoreDetailDto with message', async () => {
      const mockEntity = generateStoreDetail();
      mockEntity.createdBy = { id: 1 } as User;
      mockEntity.updatedBy = { id: 2 } as User;
      const id = mockEntity.id;
      const userId: User['id'] = 1;
      const changes: UpdateStoreDetailDto = { name: 'newName' };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockEntity);
      jest.spyOn(repository, 'merge').mockReturnValue(mockEntity);
      jest.spyOn(repository, 'save').mockResolvedValue(mockEntity);

      const { statusCode, message, data } = await service.update(
        id,
        userId,
        changes,
      );
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`Store Details has been modified`);
      expect(data).toEqual(
        expect.objectContaining({
          id: mockEntity.id,
        }),
      );
    });

    it('update should throw NotFoundException if Store Details does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`Store Details not found`);
      }
    });
  });
});
