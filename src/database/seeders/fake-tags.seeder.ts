import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Tag } from '@tag/entities/tag.entity';
import { User } from '@user/entities/user.entity';

import { generateNewTags } from '@faker/tag.faker';
import { CreateTagDto } from '@tag/dto/create-tag.dto';

import { UserRoleEnum } from '@commons/enums/user-role.enum';

@Injectable()
export class FakeTagsSeeder {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<boolean> {
    const tagCount = await this.tagRepository.count();
    const adminUsers = await this.userRepository.findBy({
      role: UserRoleEnum.ADMIN,
    });

    if (tagCount >= 50) {
      console.log('⚠️  Fake Tags already exist. Skipping seed.');
      return false;
    }

    const tags: CreateTagDto[] = generateNewTags(50);

    for (const tagData of tags) {
      const user = faker.helpers.arrayElement(Object.values(adminUsers));
      const tag = this.tagRepository.create({
        ...tagData,
        createdBy: user,
        updatedBy: user,
      });

      const savedTag = await this.tagRepository.save(tag);
      console.log(`✅ Tag created: ${savedTag.name}`);
    }

    return true;
  }
}
