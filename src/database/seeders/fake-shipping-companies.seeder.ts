import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { ShippingCompany } from '@shipping_company/entities/shipping-company.entity';
import { User } from '@user/entities/user.entity';

import { generateNewShippingCompanies } from '@faker/shippingCompany.faker';
import { CreateShippingCompanyDto } from '@shipping_company/dto/create-shipping-company.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeShippingCompaniesSeeder {
  constructor(
    @InjectRepository(ShippingCompany)
    private readonly shippingCompanyRepository: Repository<ShippingCompany>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const companyCount = await this.shippingCompanyRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (companyCount >= 10) {
      console.log('⚠️  Fake Shipping Companies already exist. Skipping seed.');
      return false;
    }

    const shippingCompanies: CreateShippingCompanyDto[] =
      generateNewShippingCompanies(10);

    for (const companyData of shippingCompanies) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const shippingCompany = this.shippingCompanyRepository.create({
        ...companyData,
        createdBy: user,
        updatedBy: user,
      });

      const savedCompany =
        await this.shippingCompanyRepository.save(shippingCompany);
      console.log(`✅ Fake Shipping Companies created: ${savedCompany.name}`);
    }

    return true;
  }
}
