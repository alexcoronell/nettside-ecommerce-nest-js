import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/* Interfaces */
import { IBaseService } from '@commons/interfaces/i-base-service';

/* Entities */
import { ProductSupplier } from './entities/product-supplier.entity';
import { Product } from '@product/entities/product.entity';
import { Supplier } from '@supplier/entities/supplier.entity';

/* DTO's */
import { CreateProductSupplierDto } from './dto/create-product-supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product-supplier.dto';

/* Types */
import { Result } from '@commons/types/result.type';

@Injectable()
export class ProductSupplierService
  implements
    IBaseService<
      ProductSupplier,
      CreateProductSupplierDto,
      UpdateProductSupplierDto
    >
{
  constructor(
    @InjectRepository(ProductSupplier)
    private readonly repo: Repository<ProductSupplier>,
  ) {}

  async countAll() {
    const total = await this.repo.count();
    return { statusCode: HttpStatus.OK, total };
  }

  async count() {
    const total = await this.repo.count({
      where: {
        isDeleted: false,
      },
    });
    return { statusCode: HttpStatus.OK, total };
  }

  async findAll() {
    const [productSuppliers, total] = await this.repo.findAndCount({
      where: {
        isDeleted: false,
      },
      order: {
        id: 'DESC',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      data: productSuppliers,
      total,
    };
  }

  async findOne(id: ProductSupplier['id']): Promise<Result<ProductSupplier>> {
    const product = await this.repo.findOne({
      relations: ['createdBy', 'updatedBy'],
      where: { id, isDeleted: false },
    });
    if (!product) {
      throw new NotFoundException(
        `The Product Supplier with id: ${id} not found`,
      );
    }
    return {
      statusCode: HttpStatus.OK,
      data: product,
    };
  }

  async findAllByProduct(
    id: Product['id'],
  ): Promise<Result<ProductSupplier[]>> {
    const [productSuppliers, total] = await this.repo.findAndCount({
      relations: ['product', 'supplier'],
      where: { product: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productSuppliers,
      total,
    };
  }

  async findAllBySupplier(
    id: Supplier['id'],
  ): Promise<Result<ProductSupplier[]>> {
    const [productSuppliers, total] = await this.repo.findAndCount({
      relations: ['product', 'supplier'],
      where: { supplier: { id } },
    });
    return {
      statusCode: HttpStatus.OK,
      data: productSuppliers,
      total,
    };
  }

  async create(
    dto: CreateProductSupplierDto,
    userId: number,
  ): Promise<Result<ProductSupplier>> {
    const newProductSupplier = this.repo.create({
      ...dto,
      product: { id: dto.product },
      supplier: { id: dto.supplier },
      createdBy: { id: userId },
      updatedBy: { id: userId },
    });
    const productSupplier = await this.repo.save(newProductSupplier);
    return {
      statusCode: HttpStatus.CREATED,
      data: productSupplier,
      message: 'The Product Supplier was created',
    };
  }

  async createMany(
    dtos: CreateProductSupplierDto[],
    userId: number,
  ): Promise<Result<ProductSupplier[]>> {
    const newProductSuppliers = dtos.map((dto) =>
      this.repo.create({
        ...dto,
        product: { id: dto.product },
        supplier: { id: dto.supplier },
        createdBy: { id: userId },
        updatedBy: { id: userId },
      }),
    );
    const productSuppliers = await this.repo.save(newProductSuppliers);
    return {
      statusCode: HttpStatus.CREATED,
      data: productSuppliers,
      message: 'The Product Suppliers were created',
    };
  }

  async update(id: number, userId: number, changes: UpdateProductSupplierDto) {
    const { data } = await this.findOne(id);
    this.repo.merge(data as ProductSupplier, {
      ...changes,
      product: { id: changes.product } as Product,
      supplier: { id: changes.supplier } as Supplier,
      updatedBy: { id: userId },
    });
    const rta = await this.repo.save(data as ProductSupplier);
    return {
      statusCode: HttpStatus.OK,
      data: rta,
      message: `The Product Supplier with id: ${id} has been modified`,
    };
  }

  async remove(id: ProductSupplier['id'], userId: number) {
    const { data } = await this.findOne(id);
    const changes = {
      isDeleted: true,
      deletedBy: { id: userId },
      deletedAt: new Date(),
    };
    this.repo.merge(data as ProductSupplier, changes);
    await this.repo.save(data as ProductSupplier);
    return {
      statusCode: HttpStatus.OK,
      message: `The Product Supplier with id: ${id} has been deleted`,
    };
  }
}
