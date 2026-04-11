import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@category/entities/category.entity';

import { generateManyNewCategories } from '@faker/category.faker';
import { CreateCategoryDto } from '@category/dto/create-category.dto';

@Injectable()
export class FakeCategoriesSeeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.categoryRepository.count();

    if (count >= 100) {
      console.log('⚠️  Fake Categories already exist. Skipping seed.');
      return false;
    }

    const Categories: CreateCategoryDto[] = generateManyNewCategories(100);

    for (const categoryData of Categories) {
      const category = this.categoryRepository.create(categoryData);

      const savedCategory = await this.categoryRepository.save(category);
      console.log(`✅ category created: ${savedCategory.name}`);
    }

    return true;
  }
}
