import {
  Injectable,
  NotFoundException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Entities */
import { ProductTag } from '@product_tag/entities/product-tag.entity';
import { Product } from '@product/entities/product.entity';
import { Tag } from '@tag/entities/tag.entity';

/* DTO's */
import { CreateProductTagDto } from '@product_tag/dto/create-product-tag.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ProductTagService {
  constructor(
    @InjectRepository(ProductTag)
    private readonly repo: Repository<ProductTag>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
  ) {}

  async countAll() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  async findAll(): Promise<Result<ProductTag[]>> {
    const [productTags, total] = await this.repo.findAndCount();
    return {
      statusCode: HttpStatus.OK,
      data: productTags,
      total,
    };
  }

  async findOne(
    criteria: Partial<Pick<ProductTag, 'productId' | 'tagId'>>,
  ): Promise<Result<ProductTag>> {
    const productTag = await this.repo.findOne({
      where: criteria,
    });
    if (!productTag) {
      throw new NotFoundException(
        `The Product Tag with productId: ${criteria.productId} and tagId: ${criteria.tagId} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: productTag,
    };
  }

  async findAllByProduct(id: Product['id']): Promise<Result<ProductTag[]>> {
    const [productTags, total] = await this.repo.findAndCount({
      relations: ['product', 'tag'],
      where: { product: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productTags,
      total,
    };
  }

  async findAllByTag(id: Tag['id']): Promise<Result<ProductTag[]>> {
    const [productTags, total] = await this.repo.findAndCount({
      relations: ['product', 'tag'],
      where: { tag: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productTags,
      total,
    };
  }

  async create(
    dto: CreateProductTagDto,
    userId: number,
  ): Promise<Result<ProductTag>> {
    const productId = dto.product;
    const tagId = dto.tag;

    // Validate that product exists
    const product = await this.productRepo.findOne({
      where: { id: productId, isDeleted: false },
    });
    if (!product) {
      throw new NotFoundException(
        `The Product with ID: ${productId} not found`,
      );
    }

    // Validate that tag exists
    const tag = await this.tagRepo.findOne({
      where: { id: tagId, isDeleted: false },
    });
    if (!tag) {
      throw new NotFoundException(`The Tag with ID: ${tagId} not found`);
    }

    // Check if product-tag relationship already exists
    const existingProductTag = await this.repo.findOne({
      where: { productId, tagId },
    });
    if (existingProductTag) {
      throw new ConflictException(`The Product Tag is already in use`);
    }

    const productTag = this.repo.create({
      product: { id: productId },
      tag: { id: tagId },
      createdBy: { id: userId },
    });
    await this.repo.save(productTag);
    return {
      statusCode: HttpStatus.CREATED,
      data: productTag,
      message: 'The Product Tag was created',
    };
  }

  async createMany(
    dtos: CreateProductTagDto | CreateProductTagDto[],
    userId: number,
  ): Promise<Result<ProductTag[]>> {
    const dtosArray = Array.isArray(dtos) ? dtos : [dtos];

    // Validate all products and tags exist before creating any
    for (const dto of dtosArray) {
      const product = await this.productRepo.findOne({
        where: { id: dto.product, isDeleted: false },
      });
      if (!product) {
        throw new NotFoundException(
          `The Product with ID: ${dto.product} not found`,
        );
      }

      const tag = await this.tagRepo.findOne({
        where: { id: dto.tag, isDeleted: false },
      });
      if (!tag) {
        throw new NotFoundException(`The Tag with ID: ${dto.tag} not found`);
      }

      // Check if product-tag relationship already exists
      const existingProductTag = await this.repo.findOne({
        where: { productId: dto.product, tagId: dto.tag },
      });
      if (existingProductTag) {
        throw new ConflictException(
          `The Product Tag with product ${dto.product} and tag ${dto.tag} is already in use`,
        );
      }
    }

    const createProductTags = dtosArray.map((item) => ({
      product: { id: item.product },
      tag: { id: item.tag },
      createdBy: { id: userId },
    }));
    const newProductTags = this.repo.create(createProductTags);
    const productTags = await this.repo.save(newProductTags);
    return {
      statusCode: HttpStatus.CREATED,
      data: productTags,
      message: 'The Product Tags were created',
    };
  }

  async delete(
    criteria: Partial<Pick<ProductTag, 'productId' | 'tagId'>>,
  ): Promise<Result<void>> {
    const productTag = await this.repo.findOne({
      where: criteria,
    });
    if (!productTag) {
      throw new NotFoundException(`The Product Tag not found`);
    }
    await this.repo.delete(criteria);
    return {
      statusCode: HttpStatus.OK,
      message: `The Product Tag has been deleted`,
    };
  }
}
