import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';

import { generateNewSuppliers } from '@faker/supplier.faker';
import { CreateSupplierDto } from '@supplier/dto/create-supplier.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeSuppliersSeeder {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const supplierCount = await this.supplierRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (supplierCount >= 50) {
      console.log('⚠️  Fake Suppliers already exist. Skipping seed.');
      return false;
    }

    const suppliers: CreateSupplierDto[] = generateNewSuppliers(50);

    for (const data of suppliers) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const supplier = this.supplierRepository.create({
        ...data,
        createdBy: user,
        updatedBy: user,
      });

      const savedSupplier = await this.supplierRepository.save(supplier);
      console.log(`✅ Supplier created: ${savedSupplier.name}`);
    }

    return true;
  }
}
