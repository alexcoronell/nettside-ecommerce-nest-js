import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistModule } from './wishlist.module';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { Wishlist } from './entities/wishlist.entity';

describe('WishlistModule', () => {
  let module: TestingModule;
  let service: WishlistService;
  let controller: WishlistController;
  let repository: Repository<Wishlist>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WishlistModule],
    })
      .overrideProvider(getRepositoryToken(Wishlist))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
      })
      .compile();

    service = module.get<WishlistService>(WishlistService);
    controller = module.get<WishlistController>(WishlistController);
    repository = module.get<Repository<Wishlist>>(getRepositoryToken(Wishlist));
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
    expect(repository).toBeDefined();
  });

  it('should have WishlistService and WishlistController', () => {
    expect(module.get(WishlistService)).toBeInstanceOf(WishlistService);
    expect(module.get(WishlistController)).toBeInstanceOf(WishlistController);
  });

  it('should inject TypeORM repository for Wishlist', () => {
    expect(module.get(getRepositoryToken(Wishlist))).toBeDefined();
  });
});
