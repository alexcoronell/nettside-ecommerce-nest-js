import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '@category/entities/category.entity';
import { Subcategory } from '@subcategory/entities/subcategory.entity';

import { generateManyNewSubcategories } from '@faker/subcategory.faker';
import { CreateSubcategoryDto } from '@subcategory/dto/create-subcategory.dto';

@Injectable()
export class FakeSubcategoriesSeeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  async seed(): Promise<boolean> {
    const categoryCount = await this.categoryRepository.count();
    const count = await this.subcategoryRepository.count();

    if (count >= 100) {
      console.log('⚠️  Fake Subcategories already exist. Skipping seed.');
      return false;
    }

    const subcategories: CreateSubcategoryDto[] = generateManyNewSubcategories(
      100,
      categoryCount,
    );

    for (const subcategoryData of subcategories) {
      const subcategory = this.categoryRepository.create(subcategoryData);

      const savedSubcategory =
        await this.subcategoryRepository.save(subcategory);
      console.log(`✅ category created: ${savedSubcategory.name}`);
    }

    return true;
  }
}
