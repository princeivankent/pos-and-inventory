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
import { UserStore, UserRole } from '../database/entities/user-store.entity';
import { Store } from '../database/entities/store.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ALL_PERMISSIONS } from '../common/permissions/permission.enum';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, full_name, store_name } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Register with Supabase using admin client to auto-confirm email
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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

    // Create a default store for the user
    const store = this.storeRepository.create({
      name: store_name || 'My Store',
      settings: {},
    });

    await this.storeRepository.save(store);

    // Assign user to the store as ADMIN
    const userStore = this.userStoreRepository.create({
      user_id: user.id,
      store_id: store.id,
      role: UserRole.ADMIN,
      is_default: true,
    });

    await this.userStoreRepository.save(userStore);

    // Sign in the newly created user to get session tokens
    const { data: signInData, error: signInError } =
      await this.supabaseService
        .getClient()
        .auth.signInWithPassword({ email, password });

    if (signInError || !signInData.session) {
      throw new BadRequestException('Account created but auto-login failed. Please sign in manually.');
    }

    // Sign our own JWT
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    const stores = [
      {
        id: store.id,
        name: store.name,
        role: UserRole.ADMIN,
        is_default: true,
        permissions: ALL_PERMISSIONS,
      },
    ];

    return {
      access_token,
      refresh_token: signInData.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      stores,
      default_store: stores[0],
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

    // Sign our own JWT so passport-jwt can verify it with JWT_SECRET
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
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
        permissions:
          us.role === UserRole.ADMIN
            ? ALL_PERMISSIONS
            : (us.permissions ?? []),
      })),
      default_store: {
        id: defaultStore.store_id,
        name: defaultStore.store.name,
        role: defaultStore.role,
        permissions:
          defaultStore.role === UserRole.ADMIN
            ? ALL_PERMISSIONS
            : (defaultStore.permissions ?? []),
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
        permissions:
          userStore.role === UserRole.ADMIN
            ? ALL_PERMISSIONS
            : (userStore.permissions ?? []),
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
      permissions:
        us.role === UserRole.ADMIN
          ? ALL_PERMISSIONS
          : (us.permissions ?? []),
    }));
  }
}
