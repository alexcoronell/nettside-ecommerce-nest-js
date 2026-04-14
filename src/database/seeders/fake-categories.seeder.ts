import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Category } from '@category/entities/category.entity';
import { User } from '@user/entities/user.entity';

import { generateManyNewCategories } from '@faker/category.faker';
import { CreateCategoryDto } from '@category/dto/create-category.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeCategoriesSeeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.categoryRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (count >= 100) {
      console.log('⚠️  Fake Categories already exist. Skipping seed.');
      return false;
    }

    const categories: CreateCategoryDto[] = generateManyNewCategories(100);

    for (const categoryData of categories) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const category = this.categoryRepository.create({
        ...categoryData,
        createdBy: user,
        updatedBy: user,
      });

      const savedCategory = await this.categoryRepository.save(category);
      console.log(`✅ Category created: ${savedCategory.name}`);
    }

    return true;
  }
}
