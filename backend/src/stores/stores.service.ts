import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../database/entities/store.entity';
import { UserStore } from '../database/entities/user-store.entity';
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

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const store = this.storeRepository.create(createStoreDto);
    return await this.storeRepository.save(store);
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
}
