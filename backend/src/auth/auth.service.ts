import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from './supabase.service';
import { User } from '../database/entities/user.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, full_name } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Register with Supabase
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Create user in our database
    const user = this.userRepository.create({
      id: data.user.id,
      email,
      full_name,
      is_active: true,
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Authenticate with Supabase
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user from database
    const user = await this.userRepository.findOne({
      where: { id: data.user.id },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Get user's stores
    const userStores = await this.userStoreRepository.find({
      where: { user_id: user.id },
      relations: ['store'],
    });

    if (userStores.length === 0) {
      throw new ForbiddenException('User is not assigned to any store');
    }

    // Find default store or use first available
    const defaultStore =
      userStores.find((us) => us.is_default) || userStores[0];

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      stores: userStores.map((us) => ({
        id: us.store_id,
        name: us.store.name,
        role: us.role,
        is_default: us.is_default,
      })),
      default_store: {
        id: defaultStore.store_id,
        name: defaultStore.store.name,
        role: defaultStore.role,
      },
    };
  }

  async switchStore(userId: string, storeId: string) {
    // Verify user has access to the store
    const userStore = await this.userStoreRepository.findOne({
      where: {
        user_id: userId,
        store_id: storeId,
      },
      relations: ['store'],
    });

    if (!userStore) {
      throw new ForbiddenException('Access to this store is denied');
    }

    return {
      store: {
        id: userStore.store_id,
        name: userStore.store.name,
        role: userStore.role,
      },
    };
  }

  async getUserStores(userId: string) {
    const userStores = await this.userStoreRepository.find({
      where: { user_id: userId },
      relations: ['store'],
    });

    return userStores.map((us) => ({
      id: us.store_id,
      name: us.store.name,
      role: us.role,
      is_default: us.is_default,
    }));
  }
}
