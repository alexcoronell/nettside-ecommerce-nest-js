import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Entities */
import { StoreDetail } from './entities/store-detail.entity';

/* DTO's */
import { UpdateStoreDetailDto } from './dto/update-store-detail.dto';
import { ResponseStoreDetailDto } from './dto/response-store-detail.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class StoreDetailService {
  constructor(
    @InjectRepository(StoreDetail)
    private readonly repo: Repository<StoreDetail>,
  ) {}

  /**
   * Maps a StoreDetail entity to ResponseStoreDetailDto.
   */
  mapEntityToResponse(entity: StoreDetail): ResponseStoreDetailDto {
    return {
      id: entity.id,
      name: entity.name,
      country: entity.country,
      state: entity.state,
      city: entity.city,
      neighborhood: entity.neighborhood,
      address: entity.address,
      phone: entity.phone,
      email: entity.email,
      legalInformation: entity.legalInformation,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy?.id ?? null,
      updatedBy: entity.updatedBy?.id ?? null,
    };
  }

  async findOne(
    id: StoreDetail['id'],
  ): Promise<Result<ResponseStoreDetailDto>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id },
    });
    if (!data) {
      throw new NotFoundException(`Store Details not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: this.mapEntityToResponse(data),
    };
  }

  async update(
    id: number,
    userId: number,
    changes: UpdateStoreDetailDto,
  ): Promise<Result<ResponseStoreDetailDto>> {
    const data = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id },
    });
    if (!data) {
      throw new NotFoundException(`Store Details not found`);
    }
    this.repo.merge(data, {
      ...changes,
      updatedBy: { id: userId },
    });
    const saved = await this.repo.save(data);
    return {
      statusCode: HttpStatus.OK,
      data: this.mapEntityToResponse(saved),
      message: `Store Details has been modified`,
    };
  }
}
