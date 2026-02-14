import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../database/entities/store.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { Product } from '../database/entities/product.entity';
import { Subscription } from '../database/entities/subscription.entity';

@Injectable()
export class UsageTrackerService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async getUsageSummary(organizationId: string) {
    const stores = await this.storeRepository.find({
      where: { organization_id: organizationId },
      select: ['id', 'name'],
    });

    const storeCount = stores.length;

    let totalUsers = 0;
    let totalProducts = 0;
    const storeDetails = [];

    for (const store of stores) {
      const userCount = await this.userStoreRepository.count({
        where: { store_id: store.id },
      });
      const productCount = await this.productRepository.count({
        where: { store_id: store.id, is_active: true },
      });

      totalUsers += userCount;
      totalProducts += productCount;

      storeDetails.push({
        store_id: store.id,
        store_name: store.name,
        users: userCount,
        products: productCount,
      });
    }

    return {
      stores: storeCount,
      total_users: totalUsers,
      total_products: totalProducts,
      store_details: storeDetails,
    };
  }

  async updateUsageStats(organizationId: string) {
    const usage = await this.getUsageSummary(organizationId);

    const stats: Record<string, any> = {
      stores: usage.stores,
      total_users: usage.total_users,
      total_products: usage.total_products,
      last_updated: new Date().toISOString(),
    };

    await this.subscriptionRepository.update(
      { organization_id: organizationId },
      { usage_stats: stats },
    );

    return usage;
  }
}
