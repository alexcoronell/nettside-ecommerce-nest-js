/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/database/seeders/user.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@user/entities/user.entity';
import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const userCount = await this.userRepository.count();

    if (userCount > 0) {
      console.log('⚠️  Users already exist. Skipping seed.');
      return false;
    }

    const password = process.env.SEED_ADMIN_PASSWORD || '12345678';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        firstname: 'Admin',
        lastname: 'User',
        email: (process.env.SEED_ADMIN_EMAIL as string) || 'admin@example.com',
        role: UserRoleEnum.ADMIN,
        phoneNumber: '+57 300 000 0000',
        city: 'Medellín',
        neighborhood: 'Centro',
      },
      {
        firstname: 'Seller',
        lastname: 'User',
        email: 'seller@email.com',
        role: UserRoleEnum.SELLER,
        phoneNumber: '+57 300 111 1111',
        city: 'Medellín',
        neighborhood: 'Laureles',
      },
      {
        firstname: 'Customer',
        lastname: 'User',
        email: 'customer@email.com',
        role: UserRoleEnum.CUSTOMER,
        phoneNumber: '+57 300 222 2222',
        city: 'Bello',
        neighborhood: 'Centro',
      },
    ];

    let createdBy: User | null = null;

    for (const userData of users) {
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        department: 'Antioquia',
        address: 'N/A',
        isActive: true,
        isDeleted: false,
        createdBy: createdBy,
        updatedBy: createdBy,
      });

      const savedUser = await this.userRepository.save(user);

      // First user (admin) becomes the createdBy for others
      if (!createdBy) {
        createdBy = savedUser;
      }

      console.log(`✅ User created: ${savedUser.email}`);
    }

    return true;
  }
}
