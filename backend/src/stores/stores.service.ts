import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../database/entities/store.entity';
import { UserStore, UserRole } from '../database/entities/user-store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
  ) {}

  async create(
    createStoreDto: CreateStoreDto,
    userId: string,
    organizationId: string,
  ): Promise<Store> {
    if (!organizationId) {
      throw new BadRequestException(
        'Cannot create additional stores for legacy accounts. Please contact support.',
      );
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      settings: createStoreDto.settings ?? {},
      organization_id: organizationId,
    });
    await this.storeRepository.save(store);

    const userStore = this.userStoreRepository.create({
      user_id: userId,
      store_id: store.id,
      role: UserRole.ADMIN,
      is_default: false,
    });
    await this.userStoreRepository.save(userStore);

    return store;
  }

  async findAll(): Promise<Store[]> {
    return await this.storeRepository.find();
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }
    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);
    Object.assign(store, updateStoreDto);
    return await this.storeRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepository.remove(store);
  }

  async getUserStores(userId: string): Promise<Store[]> {
    const userStores = await this.userStoreRepository.find({
      where: { user_id: userId },
      relations: ['store'],
    });
    return userStores.map((us) => us.store);
  }

  async verifyUserAccess(userId: string, storeId: string): Promise<boolean> {
    const userStore = await this.userStoreRepository.findOne({
      where: {
        user_id: userId,
        store_id: storeId,
      },
    });
    return !!userStore;
  }

  async updateSettings(
    id: string,
    settings: Record<string, any>,
  ): Promise<Store> {
    const store = await this.findOne(id);
    store.settings = { ...store.settings, ...settings };
    return await this.storeRepository.save(store);
  }
}
