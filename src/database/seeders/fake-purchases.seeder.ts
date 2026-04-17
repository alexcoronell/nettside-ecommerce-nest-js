import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Product } from '@product/entities/product.entity';
import { Purchase } from '@purchase/entities/purchase.entity';
import { PurchaseDetail } from '@purchase_detail/entities/purchase-detail.entity';
import { Supplier } from '@supplier/entities/supplier.entity';
import { User } from '@user/entities/user.entity';

import { generateNewPurchases } from '@faker/purchase.faker';
import { CreatePurchaseDto } from '@purchase/dto/create-purchase.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakePurchasesSeeder {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseDetail)
    private readonly detailRepository: Repository<PurchaseDetail>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const purchaseCount = await this.purchaseRepository.count();
    const suppliers = await this.supplierRepository.find({
      where: { isDeleted: false },
    });
    const products = await this.productRepository.find({
      where: { isDeleted: false },
    });
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (purchaseCount >= 200) {
      console.log('⚠️  Fake Purchases already exist. Skipping seed.');
      return false;
    }

    if (suppliers.length === 0) {
      console.log('⚠️  No suppliers found. Run FakeSuppliersSeeder first.');
      return false;
    }

    if (products.length === 0) {
      console.log('⚠️  No products found. Run FakeProductsSeeder first.');
      return false;
    }

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. Run UserSeeder first.');
      return false;
    }

    const purchases: CreatePurchaseDto[] = generateNewPurchases(200);

    for (const data of purchases) {
      const supplier = faker.helpers.arrayElement(suppliers);
      const user = faker.helpers.arrayElement(adminUsers);

      // Create the purchase
      const purchase = this.purchaseRepository.create({
        purchaseDate: data.purchaseDate,
        totalAmount: data.totalAmount,
        supplier: supplier,
        createdBy: user,
        updatedBy: user,
      });

      const savedPurchase = await this.purchaseRepository.save(purchase);

      // Create 1-5 random purchase details
      const numDetails = faker.number.int({ min: 1, max: 15 });
      const selectedProducts = faker.helpers.arrayElements(
        products,
        numDetails,
      );

      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: 20 });
        const unitPrice = parseFloat(faker.commerce.price());
        const subtotal = quantity * unitPrice;

        const detail = this.detailRepository.create({
          quantity,
          unitPrice,
          subtotal,
          purchase: savedPurchase,
          product: product,
        });

        await this.detailRepository.save(detail);
      }

      console.log(
        `✅ Purchase created: ${savedPurchase.id} - $${savedPurchase.totalAmount} (${numDetails} details)`,
      );
    }

    return true;
  }
}
