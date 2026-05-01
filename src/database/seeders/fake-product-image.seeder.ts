import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

import { createProductImage } from '@faker/productImage.faker';
import { ProductImage } from '@product_images/entities/product-image.entity';
import { CreateProductImageDto } from '@product_images/dto/create-product-image.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeProductImageSeeder {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const products = await this.productRepository.find();
    if (products.length === 0) {
      console.warn(
        '⚠️  No products found. Please seed products before seeding product images.',
      );
      return false;
    }

    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });
    if (adminUsers.length === 0) {
      console.warn(
        '⚠️  No admin users found. Please seed admin users before seeding product images.',
      );
      return false;
    }

    let totalImagesCreated = 0;

    for (const product of products) {
      const totalImagesThisProduct = faker.number.int({ min: 1, max: 10 });
      const currentImages = await this.productImageRepository.countBy({
        product: { id: product.id },
      });
      if (currentImages === 0) {
        for (let i = 0; i < totalImagesThisProduct; i++) {
          const image: CreateProductImageDto = createProductImage();
          const newImage = this.productImageRepository.create({
            ...image,
            isMain: i === 0, // Mark the first image as main
            product: { id: product.id } as Product,
            createdBy: {
              id: faker.helpers.arrayElement(adminUsers).id,
            } as User,
            updatedBy: {
              id: faker.helpers.arrayElement(adminUsers).id,
            } as User,
          });
          await this.productImageRepository.save(newImage);
          totalImagesCreated++;
        }
        console.log(
          `✅ Created ${totalImagesThisProduct} images for product ${product.name}`,
        );
      }
    }
    if (totalImagesCreated === 0) {
      console.log('⚠️  Fake Products Images already exist. Skipping seed.');
      return false;
    }
    console.log(`✅ ${totalImagesCreated} images created`);
    return true;
  }
}
