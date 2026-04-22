import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Discount } from '@discount/entities/discount.entity';
import { User } from '@user/entities/user.entity';

import { generateNewDiscounts } from '@faker/discount.faker';
import { CreateDiscountDto } from '@discount/dto/create-discount.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeDiscountsSeeder {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.discountRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (count >= 100) {
      console.log('⚠️  Fake discounts already exist. Skipping seed.');
      return false;
    }

    const discounts: CreateDiscountDto[] = generateNewDiscounts(100);

    for (const discountData of discounts) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const discount = this.discountRepository.create({
        ...discountData,
        createdBy: user,
        updatedBy: user,
      });

      const savedDiscount = await this.discountRepository.save(discount);
      console.log(`✅ Discount created: ${savedDiscount.name}`);
    }

    return true;
  }
}
