import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { LowStockAlert, AlertType } from '../database/entities/low-stock-alert.entity';
import { Product } from '../database/entities/product.entity';
import { Store } from '../database/entities/store.entity';
import { Subscription, SubscriptionStatus } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { UserStore, UserRole } from '../database/entities/user-store.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(LowStockAlert)
    private alertRepository: Repository<LowStockAlert>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    private emailService: EmailService,
  ) {}

  @Cron('0 9 * * *')
  async runDailyCheck() {
    this.logger.log('Running daily low-stock alert check...');
    const storeIds = await this.getKadenaStoreIds();
    this.logger.log(`Found ${storeIds.length} Kadena store(s) to check`);

    for (const storeId of storeIds) {
      try {
        await this.checkStoreStock(storeId);
      } catch (err) {
        this.logger.error(`Failed to check stock for store ${storeId}`, err);
      }
    }
  }

  async checkStoreStock(storeId: string): Promise<void> {
    // Find all active products at or below reorder level
    const lowStockProducts = await this.productRepository
      .createQueryBuilder('p')
      .where('p.store_id = :storeId', { storeId })
      .andWhere('p.is_active = true')
      .andWhere('p.current_stock <= p.reorder_level')
      .getMany();

    const lowStockProductIds = new Set(lowStockProducts.map((p) => p.id));

    // Fetch all unresolved alerts for this store
    const unresolvedAlerts = await this.alertRepository.find({
      where: { store_id: storeId, is_resolved: false },
    });

    // Auto-resolve alerts for products that are back in stock
    const toResolve = unresolvedAlerts.filter((a) => !lowStockProductIds.has(a.product_id));
    if (toResolve.length > 0) {
      await this.alertRepository.save(
        toResolve.map((a) => ({ ...a, is_resolved: true, resolved_at: new Date() })),
      );
    }

    // Find products that already have an unresolved alert
    const alertedProductIds = new Set(
      unresolvedAlerts
        .filter((a) => !toResolve.some((r) => r.id === a.id))
        .map((a) => a.product_id),
    );

    // Create new alerts for low-stock products without existing unresolved alerts
    const newAlertProducts = lowStockProducts.filter((p) => !alertedProductIds.has(p.id));

    if (newAlertProducts.length === 0) return;

    const newAlerts = newAlertProducts.map((p) =>
      this.alertRepository.create({
        store_id: storeId,
        product_id: p.id,
        alert_type: p.current_stock === 0 ? AlertType.OUT_OF_STOCK : AlertType.LOW_STOCK,
        alert_date: new Date(),
        is_resolved: false,
        email_sent: false,
      }),
    );

    const savedAlerts = await this.alertRepository.save(newAlerts);
    this.logger.log(`Created ${savedAlerts.length} new alert(s) for store ${storeId}`);

    // Send alert emails directly from the cron job
    await this.sendAlertsEmail(storeId, savedAlerts, newAlertProducts);
  }

  private async sendAlertsEmail(
    storeId: string,
    alerts: LowStockAlert[],
    products: Product[],
  ): Promise<void> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });

    const adminUserStores = await this.userStoreRepository.find({
      where: { store_id: storeId, role: UserRole.ADMIN },
      relations: ['user'],
    });

    const emails = new Set<string>();
    if (store?.email) emails.add(store.email);
    for (const us of adminUserStores) {
      if (us.user?.email) emails.add(us.user.email);
    }

    if (emails.size === 0) {
      this.logger.warn(`No recipient emails found for store ${storeId}, skipping alert emails`);
      return;
    }

    const storeName = store?.name ?? 'Your Store';
    const productPayload = products.map((p) => ({
      name: p.name,
      sku: p.sku ?? '',
      currentStock: p.current_stock,
      reorderLevel: p.reorder_level,
      alertType: p.current_stock === 0 ? AlertType.OUT_OF_STOCK : AlertType.LOW_STOCK,
    }));

    const alertIds = alerts.map((a) => a.id);

    for (const email of emails) {
      try {
        await this.emailService.sendLowStockAlertEmail(email, storeName, productPayload);
      } catch (err) {
        this.logger.error(`Low-stock alert email failed for ${email}`, err);
      }
    }

    // Mark all new alerts as email_sent
    await this.alertRepository.save(
      alerts.map((a) => ({ ...a, email_sent: true, email_sent_at: new Date() })),
    );
    this.logger.log(`Marked ${alertIds.length} alert(s) as email_sent for store ${storeId}`);
  }

  private async getKadenaStoreIds(): Promise<string[]> {
    // Find all active/trial subscriptions on a plan with low_stock_alerts feature
    const plans = await this.planRepository
      .createQueryBuilder('plan')
      .where(`plan.features->>'low_stock_alerts' = 'true'`)
      .andWhere('plan.is_active = true')
      .getMany();

    if (plans.length === 0) return [];

    const planIds = plans.map((p) => p.id);

    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.plan_id IN (:...planIds)', { planIds })
      .andWhere('sub.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .getMany();

    if (subscriptions.length === 0) return [];

    const orgIds = subscriptions.map((s) => s.organization_id);

    const stores = await this.storeRepository
      .createQueryBuilder('store')
      .where('store.organization_id IN (:...orgIds)', { orgIds })
      .getMany();

    return stores.map((s) => s.id);
  }
}
