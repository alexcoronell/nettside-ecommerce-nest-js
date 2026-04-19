import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { PaymentMethod } from '../../payment-method/entities/payment-method.entity';
import { Product } from '../../product/entities/product.entity';
import { Sale } from '../../sale/entities/sale.entity';
import { SaleDetail } from '../../sale-detail/entities/sale-detail.entity';
import { User } from '../../user/entities/user.entity';

import { SaleStatusEnum } from '../../commons/enums/sale-status.enum';

const TOTAL = 500;

@Injectable()
export class FakeSalesSeeder {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleDetail)
    private readonly detailRepository: Repository<SaleDetail>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.saleRepository.count();
    const products = await this.productRepository.find({
      where: { isDeleted: false },
    });
    const paymentMethods = await this.paymentMethodRepository.find({
      where: { isDeleted: false },
    });
    const users = await this.userRepository.find({
      where: { isDeleted: false },
    });

    if (count >= TOTAL) {
      console.log('⚠️  Fake Sales already exist. Skipping seed.');
      return false;
    }

    if (products.length === 0) {
      console.log('⚠️  No products found. Run FakeProductsSeeder first.');
      return false;
    }

    if (paymentMethods.length === 0) {
      console.log(
        '⚠️  No payment methods found. Run FakePaymentMethodsSeeder first.',
      );
      return false;
    }

    if (users.length === 0) {
      console.log('⚠️  No users found. Run UserSeeder first.');
      return false;
    }

    console.log(`🚀 Seeding ${TOTAL} fake sales...`);

    const statusOptions = Object.values(SaleStatusEnum);

    for (let i = 0; i < TOTAL; i++) {
      const user = faker.helpers.arrayElement(users);
      const paymentMethod = faker.helpers.arrayElement(paymentMethods);

      // Random total amount
      const totalAmount = parseFloat(
        faker.commerce.price({ min: 100, max: 10000 }),
      );

      // Create the sale
      const sale = this.saleRepository.create({
        totalAmount,
        shippingAddress: faker.location.streetAddress(),
        paymentMethod,
        status: faker.helpers.arrayElement(statusOptions),
        user,
        isCancelled: false,
      });

      const savedSale = await this.saleRepository.save(sale);

      // Create 1-5 random sale details
      const numDetails = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(
        products,
        numDetails,
      );

      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: 10 });
        const unitPrice = parseFloat(faker.commerce.price());
        const subtotal = parseFloat((quantity * unitPrice).toFixed(2));

        const detail = this.detailRepository.create({
          quantity,
          unitPrice,
          subtotal,
          sale: savedSale,
          product,
        });

        await this.detailRepository.save(detail);
      }

      if ((i + 1) % 50 === 0) {
        console.log(
          `✅ Created ${i + 1}/${TOTAL} sales with ${numDetails} details each`,
        );
      }
    }

    console.log(`✅ Successfully seeded ${TOTAL} fake sales with details`);
    return true;
  }
}
