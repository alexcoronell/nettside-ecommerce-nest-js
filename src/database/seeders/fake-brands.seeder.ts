import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '@brand/entities/brand.entity';

import { generateManyNewBrands } from '@faker/brand.faker';
import { CreateBrandDto } from '@brand/dto/create-brand.dto';

@Injectable()
export class FakeBrandsSeeder {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async seed(): Promise<boolean> {
    const brandCount = await this.brandRepository.count();

    if (brandCount >= 100) {
      console.log('⚠️  Fake Brands already exist. Skipping seed.');
      return false;
    }

    const brands: CreateBrandDto[] = generateManyNewBrands(100);

    for (const brandData of brands) {
      const brand = this.brandRepository.create(brandData);

      const savedBrand = await this.brandRepository.save(brand);
      console.log(`✅ Brand created: ${savedBrand.name}`);
    }

    return true;
  }
}
