import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreDetail } from '@store_detail/entities/store-detail.entity';
import { User } from '@user/entities/user.entity';

import { UpdateStoreDetailDto } from '@store_detail/dto/update-store-detail.dto';

import { generateStoreDetail } from '@faker/storeDetail.faker';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeStoreDetailsSeeder {
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

    if (count === 0) {
      throw new Error('⚠️  Default Store Details is not exist. Skipping seed.');
    }

    const adminUser = adminUsers[0];

    const storeDetail: StoreDetail = (await this.storeDetailRepository.findOne({
      where: { id: 1 },
    })) as StoreDetail;

    if (storeDetail.name !== null) {
      console.log('⚠️  Default Store Details already updated. Skipping seed.');
      return false;
    }

    const modifiedStoreDetail: UpdateStoreDetailDto = generateStoreDetail();
    const changes = {
      ...modifiedStoreDetail,
      updatedBy: adminUser,
    };

    const storeDetailSaved = this.storeDetailRepository.merge(
      storeDetail,
      changes,
    );

    await this.storeDetailRepository.save(storeDetailSaved);
    console.log(`✅ Fake Store Details updated`);

    return true;
  }
}
