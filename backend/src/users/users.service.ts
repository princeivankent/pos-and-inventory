import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserStore, UserRole } from '../database/entities/user-store.entity';
import { SupabaseService } from '../auth/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    private supabaseService: SupabaseService,
  ) {}

  async findAllByStore(
    storeId: string,
  ): Promise<Array<{ user: User; role: UserRole }>> {
    const userStores = await this.userStoreRepository.find({
      where: { store_id: storeId },
      relations: ['user'],
    });

    return userStores.map((us) => ({
      id: us.user.id,
      email: us.user.email,
      full_name: us.user.full_name,
      is_active: us.user.is_active,
      role: us.role,
    })) as any;
  }

  async create(dto: CreateUserDto, storeId: string): Promise<any> {
    // Check if user already exists in our database
    let user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (user) {
      // Check if already assigned to this store
      const existing = await this.userStoreRepository.findOne({
        where: { user_id: user.id, store_id: storeId },
      });
      if (existing) {
        throw new ConflictException(
          'User is already assigned to this store',
        );
      }
    } else {
      // Create Supabase account
      const supabase = this.supabaseService.getAdminClient();
      const { data, error } = await supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      // Create user in our database
      user = this.userRepository.create({
        id: data.user.id,
        email: dto.email,
        full_name: dto.full_name,
        is_active: true,
      });
      await this.userRepository.save(user);
    }

    // Assign user to store with role
    const userStore = this.userStoreRepository.create({
      user_id: user.id,
      store_id: storeId,
      role: dto.role,
      is_default: false,
    });
    await this.userStoreRepository.save(userStore);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: dto.role,
    };
  }

  async updateRole(
    userId: string,
    dto: UpdateUserRoleDto,
    storeId: string,
  ): Promise<any> {
    const userStore = await this.userStoreRepository.findOne({
      where: { user_id: userId, store_id: storeId },
      relations: ['user'],
    });

    if (!userStore) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this store`,
      );
    }

    userStore.role = dto.role;
    await this.userStoreRepository.save(userStore);

    return {
      id: userStore.user.id,
      email: userStore.user.email,
      full_name: userStore.user.full_name,
      role: userStore.role,
    };
  }

  async deactivate(userId: string, storeId: string): Promise<void> {
    const userStore = await this.userStoreRepository.findOne({
      where: { user_id: userId, store_id: storeId },
    });

    if (!userStore) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this store`,
      );
    }

    // Remove the user-store association (don't delete the user account)
    await this.userStoreRepository.remove(userStore);
  }
}
