import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { PaymentMethod } from '@payment_method/entities/payment-method.entity';
import { User } from '@user/entities/user.entity';

import { generateNewPaymentMethods } from '@faker/paymentMethod.faker';
import { CreatePaymentMethodDto } from '@payment_method/dto/create-payment-method.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakePaymentMethodsSeeder {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const paymentMethodCount = await this.paymentMethodRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (paymentMethodCount >= 30) {
      console.log('⚠️  Fake Payment Methods already exist. Skipping seed.');
      return false;
    }

    const paymentMethod: CreatePaymentMethodDto[] =
      generateNewPaymentMethods(30);

    for (const paymentMethodData of paymentMethod) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const paymentMethod = this.paymentMethodRepository.create({
        ...paymentMethodData,
        createdBy: user,
        updatedBy: user,
      });

      const savedPaymentMethod =
        await this.paymentMethodRepository.save(paymentMethod);
      console.log(`✅ Payment Method created: ${savedPaymentMethod.name}`);
    }

    return true;
  }
}
