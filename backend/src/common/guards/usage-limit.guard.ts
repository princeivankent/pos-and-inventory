import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CHECK_LIMIT_KEY, CheckLimitOptions } from '../decorators/check-limit.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { Product } from '../../database/entities/product.entity';
import { UserStore } from '../../database/entities/user-store.entity';
import { Store } from '../../database/entities/store.entity';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitOptions = this.reflector.getAllAndOverride<CheckLimitOptions>(
      CHECK_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No limit check required - allow
    if (!limitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const subscription = request.user?.subscription;

    // No subscription context (legacy store or guard not applied) - allow
    if (!subscription) {
      return true;
    }

    const storeId = request.user.storeId;
    const organizationId = request.user.organizationId;
    const plan = subscription.plan;

    switch (limitOptions.resource) {
      case 'products': {
        if (!storeId) return true;
        const productCount = await this.productRepository.count({
          where: { store_id: storeId, is_active: true },
        });
        if (productCount >= plan.max_products_per_store) {
          throw new ForbiddenException(
            `You have reached the maximum of ${plan.max_products_per_store} products for your ${plan.name} plan. Please upgrade to add more.`,
          );
        }
        break;
      }

      case 'users': {
        if (!storeId) return true;
        const userCount = await this.userStoreRepository.count({
          where: { store_id: storeId },
        });
        if (userCount >= plan.max_users_per_store) {
          throw new ForbiddenException(
            `You have reached the maximum of ${plan.max_users_per_store} users per store for your ${plan.name} plan. Please upgrade to add more.`,
          );
        }
        break;
      }

      case 'stores': {
        if (!organizationId) return true;
        const storeCount = await this.storeRepository.count({
          where: { organization_id: organizationId },
        });
        if (storeCount >= plan.max_stores) {
          throw new ForbiddenException(
            `You have reached the maximum of ${plan.max_stores} stores for your ${plan.name} plan. Please upgrade to add more.`,
          );
        }
        break;
      }
    }

    return true;
  }
}
