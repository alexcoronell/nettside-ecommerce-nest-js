import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreDetail } from '@store_detail/entities/store-detail.entity';
import { User } from '@user/entities/user.entity';

import { CreateStoreDetailDto } from '@store_detail/dto/create-store-detail.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class DefaultStoreDetailsSeeder {
  constructor(
    @InjectRepository(StoreDetail)
    private readonly storeDetailRepository: Repository<StoreDetail>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const count = await this.storeDetailRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (count > 0) {
      console.log('⚠️  Default Store Details already exist. Skipping seed.');
      return false;
    }

    const adminUser = adminUsers[0];

    const defaultStoreDetail: CreateStoreDetailDto = {
      name: null,
      country: null,
      state: null,
      city: null,
      neighborhood: null,
      address: null,
      phone: null,
      email: null,
      legalInformation: null,
    };

    const storeDetailSaved = this.storeDetailRepository.create({
      ...defaultStoreDetail,
      createdBy: adminUser,
      updatedBy: adminUser,
    });

    await this.storeDetailRepository.save(storeDetailSaved);
    console.log(`✅ Store Details created`);

    return true;
  }
}
