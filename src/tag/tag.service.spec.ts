/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Services */
import { TagService } from './tag.service';

/* Entity */
import { Tag } from './entities/tag.entity';

/* DTO's */
import { UpdateTagDto } from './dto/update-tag.dto';

/* Faker */
import { generateTag, generateManyTags } from '@faker/tag.faker';
import { User } from '@user/entities/user.entity';

describe('TagService', () => {
  let service: TagService;
  let repository: Repository<Tag>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
          useClass: Repository,
        },
      ],
    }).compile();
    service = module.get<TagService>(TagService);
    repository = module.get<Repository<Tag>>(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('count tags services', () => {
    it('should return total all tags', async () => {
      jest.spyOn(repository, 'count').mockResolvedValue(100);

      const { statusCode, total } = await service.countAll();
      expect(repository.count).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(total).toEqual(100);
    });

    it('should return total tags not removed', async () => {
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

  describe('find tags services', () => {
    it('findAll should return all tags with pagination', async () => {
      const mocks = generateManyTags(1);

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mocks.slice(0, 10), mocks.length]);

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
      expect(meta.total).toEqual(mocks.length);
      expect(data).toEqual(mocks.slice(0, 10));
    });

    it('findOne should return a tags', async () => {
      const mock = generateTag();
      const id = mock.id;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);

      const { statusCode, data } = await service.findOne(id);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith({
        relations: ['createdBy', 'updatedBy'],
        where: { id, isDeleted: false },
      });
      expect(statusCode).toBe(200);
      expect(data).toEqual(mock);
    });

    it('findOne should throw NotFoundException if tag does not exist', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOne(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Tag with ID: ${id} not found`);
      }
    });

    it('findOne should throw NotFoundException if tags does not exist with Rejects', async () => {
      const id = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrowError(
        new NotFoundException(`The Tag with ID: ${id} not found`),
      );
    });

    it('findOneByName should return a tag', async () => {
      const tag = generateTag();

      jest.spyOn(repository, 'findOne').mockResolvedValue(tag);

      const { statusCode, data } = await service.findOneByName(tag.name);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(data).toEqual(tag);
    });

    it('findOneByName should throw NotFoundException if Tag does not exist', async () => {
      const name = 'nameTest';
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.findOneByName(name);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Tag with NAME: ${name} not found`);
      }
    });
  });

  describe('create tags services', () => {
    it('create should return a Tag', async () => {
      const mock = generateTag();
      const userId: User['id'] = 1;

      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, data } = await service.create(mock, userId);
      expect(statusCode).toBe(201);
      expect(data).toEqual(mock);
    });

    it('create should return Conflict Exception when name Tag exists', async () => {
      const mock = generateTag();
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'create').mockReturnValue(mock);
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      try {
        await service.create(mock, userId);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(`Tag ${mock.name} already exists`);
      }
    });
  });

  describe('update tags services', () => {
    it('update should return message: have been modified', async () => {
      const mock = generateTag();
      const id = mock.id;
      const changes: UpdateTagDto = { name: 'newName' };
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue({ ...mock, ...changes });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.update(id, userId, changes);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.merge).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Tag with ID: ${id} has been modified`);
    });

    it('update should throw NotFoundException if Tag does not exist', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      try {
        await service.update(id, userId, { name: 'newName' });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe(`The Tag with ID: ${id} not found`);
      }
    });
  });

  describe('remove tags services', () => {
    it('remove should return status and message', async () => {
      const mock = generateTag();
      const id = mock.id;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mock);
      jest.spyOn(repository, 'merge').mockReturnValue({
        ...mock,
        isDeleted: true,
      });
      jest.spyOn(repository, 'save').mockResolvedValue(mock);

      const { statusCode, message } = await service.remove(id, userId);
      expect(statusCode).toBe(200);
      expect(message).toEqual(`The Tag with ID: ${id} has been deleted`);
    });

    it('remove should throw NotFoundException if Tag does not exist with Rejects', async () => {
      const id = 1;
      const userId: User['id'] = 1;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrowError(
        new NotFoundException(`The Tag with ID: ${id} not found`),
      );
    });
  });
});
