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
import { Organization } from '../database/entities/organization.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus } from '../database/entities/subscription.entity';
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
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
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

    // Create Organization for the user
    const organization = this.organizationRepository.create({
      name: `${full_name}'s Organization`,
      owner_user_id: user.id,
      billing_email: email,
    });

    await this.organizationRepository.save(organization);

    // Create a default store linked to the organization
    const store = this.storeRepository.create({
      name: store_name || 'My Store',
      settings: {},
      organization_id: organization.id,
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

    // Create trial subscription on Tindahan plan (14 days)
    const subscriptionInfo = await this.createTrialForOrganization(organization.id);

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
      subscription: subscriptionInfo,
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

    if (!data.session) {
      throw new UnauthorizedException('Authentication failed: no session returned. Please verify your email.');
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

    // Filter out any user_stores with missing store relations
    const validUserStores = userStores.filter((us) => us.store);

    if (validUserStores.length === 0) {
      throw new ForbiddenException('User is not assigned to any store');
    }

    // Find default store or use first available
    const defaultStore =
      validUserStores.find((us) => us.is_default) || validUserStores[0];

    // Sign our own JWT so passport-jwt can verify it with JWT_SECRET
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    // Get subscription info from default store's organization
    const subscriptionInfo = await this.getSubscriptionInfo(defaultStore.store.id);

    return {
      access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      stores: validUserStores.map((us) => ({
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
      subscription: subscriptionInfo,
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

  private async createTrialForOrganization(organizationId: string) {
    const plan = await this.planRepository.findOne({
      where: { plan_code: 'tindahan', is_active: true },
    });

    if (!plan) {
      return null;
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const subscription = this.subscriptionRepository.create({
      organization_id: organizationId,
      plan_id: plan.id,
      status: SubscriptionStatus.TRIAL,
      trial_start: now,
      trial_end: trialEnd,
    });

    await this.subscriptionRepository.save(subscription);

    return {
      status: 'trial',
      plan_code: plan.plan_code,
      plan_name: plan.name,
      trial_ends_at: trialEnd,
      features: plan.features,
    };
  }

  private async getSubscriptionInfo(storeId: string) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      select: ['id', 'organization_id'],
    });

    if (!store?.organization_id) {
      return null;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: store.organization_id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      return null;
    }

    return {
      status: subscription.status,
      plan_code: subscription.plan.plan_code,
      plan_name: subscription.plan.name,
      trial_ends_at: subscription.trial_end,
      current_period_end: subscription.current_period_end,
      features: subscription.plan.features,
      usage: {
        max_stores: subscription.plan.max_stores,
        max_users_per_store: subscription.plan.max_users_per_store,
        max_products_per_store: subscription.plan.max_products_per_store,
      },
    };
  }
}
