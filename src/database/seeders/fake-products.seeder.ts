import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { Brand } from '@brand/entities/brand.entity';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { Product } from '@product/entities/product.entity';
import { User } from '@user/entities/user.entity';

import { generateNewProducts } from '@faker/product.faker';
import { CreateProductDto } from '@product/dto/create-product.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

import { createSlug } from '@commons/utils/create-slug.util';

@Injectable()
export class FakeProductsSeeder {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.productRepository.count();
    if (count >= 400) {
      console.log('⚠️  Fake Products already exist. Skipping seed.');
      return false;
    }

    const brands = await this.brandRepository.find();
    const categories = await this.categoryRepository.find({
      relations: {
        subcategories: true,
      },
      where: {
        subcategories: {
          id: Not(IsNull()),
        },
      },
    });
    const subcategories = await this.subcategoryRepository.find({
      relations: ['category'],
    });
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (
      brands.length === 0 ||
      categories.length === 0 ||
      subcategories.length === 0
    ) {
      if (brands.length === 0)
        console.log('❌ There are not brands to create products');
      if (categories.length === 0)
        console.log('❌ There are not categories to create products');
      if (subcategories.length === 0)
        console.log('❌ There are not subcategories to create products');
      throw new Error('Dependencies not found');
    }

    const products: CreateProductDto[] = generateNewProducts(400 - count);
    let countProducts = 0;

    for (const productData of products) {
      const brand = faker.helpers.arrayElement(brands);
      const category = faker.helpers.arrayElement(categories);

      const filteredSubcategories = subcategories.filter(
        (sub) => sub.category.id === category.id,
      );

      // ✅ Verificación extra para evitar el crash de Faker si una categoría está huérfana
      if (filteredSubcategories.length === 0) {
        console.log(
          `Skipping product because category ${category.name} has no subcategories.`,
        );
        continue;
      }

      const subcategory = faker.helpers.arrayElement(filteredSubcategories);
      const adminUser = faker.helpers.arrayElement(Object.values(adminUsers));
      const product = this.productRepository.create({
        ...productData,
        slug: createSlug(productData.name),
        brand,
        category,
        subcategory,
        createdBy: adminUser,
        updatedBy: adminUser,
      });
      const savedProduct = await this.productRepository.save(product);
      console.log(`✅ Product created: ${savedProduct.name}`);
      countProducts += 1;
    }
    console.log(`✅ ${countProducts} products created`);
    return true;
  }
}
