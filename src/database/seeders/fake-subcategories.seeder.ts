import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';
import { User } from '@user/entities/user.entity';

import { generateManyNewSubcategories } from '@faker/subcategory.faker';
import { CreateSubcategoryDto } from '@subcategory/dto/create-subcategory.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

import { createSlug } from '@commons/utils/create-slug.util';

@Injectable()
export class FakeSubcategoriesSeeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.subcategoryRepository.count();
    const categories = await this.categoryRepository.find();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (count >= 200) {
      console.log('⚠️  Fake Subcategories already exist. Skipping seed.');
      return false;
    }

    const subcategories: CreateSubcategoryDto[] =
      generateManyNewSubcategories(200);

    for (const subcategoryData of subcategories) {
      const subcategory = this.subcategoryRepository.create({
        ...subcategoryData,
        slug: createSlug(subcategoryData.name),
        category: faker.helpers.arrayElement(categories),
        createdBy: faker.helpers.arrayElement(Object.values(adminUsers)),
        updatedBy: faker.helpers.arrayElement(Object.values(adminUsers)),
      });

      const savedSubcategory =
        await this.subcategoryRepository.save(subcategory);
      console.log(`✅ Subcategory created: ${savedSubcategory.name}`);
    }

    return true;
  }
}
