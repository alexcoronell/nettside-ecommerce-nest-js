/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/database/seeders/user.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@user/entities/user.entity';

import { generateManyUsers } from '@faker/user.faker';

@Injectable()
export class FakeUsersSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const userCount = await this.userRepository.count();
    const adminUser = await this.userRepository.findOneBy({ id: 1 });

    if (userCount > 100) {
      console.log('⚠️  Fake Users already exist. Skipping seed.');
      return false;
    }

    const numberUsers: number = Number(process.env.USERS_FAKE);
    const password = '12345678';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = generateManyUsers(numberUsers);

    for (const userData of users) {
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        createdBy: adminUser,
      });

      const savedUser = await this.userRepository.save(user);
      console.log(`✅ User created: ${savedUser.email}`);
    }

    return true;
  }
}
