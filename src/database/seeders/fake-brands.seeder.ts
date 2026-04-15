import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Brand } from '@brand/entities/brand.entity';
import { User } from '@user/entities/user.entity';

import { generateManyNewBrands } from '@faker/brand.faker';
import { CreateBrandDto } from '@brand/dto/create-brand.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

import { createSlug } from '@commons/utils/create-slug.util';

@Injectable()
export class FakeBrandsSeeder {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const brandCount = await this.brandRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (brandCount >= 100) {
      console.log('⚠️  Fake Brands already exist. Skipping seed.');
      return false;
    }

    const brands: CreateBrandDto[] = generateManyNewBrands(100);

    for (const brandData of brands) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const brand = this.brandRepository.create({
        ...brandData,
        slug: createSlug(brandData.name),
        createdBy: user,
        updatedBy: user,
      });

      const savedBrand = await this.brandRepository.save(brand);
      console.log(`✅ Brand created: ${savedBrand.name}`);
    }

    return true;
  }
}
