import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../database/entities/subscription.entity';
import { Organization } from '../database/entities/organization.entity';

@Injectable()
export class SubscriptionRenewalService {
  private readonly logger = new Logger(SubscriptionRenewalService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Daily midnight: Process subscription renewals
   * - Check for subscriptions with expired periods
   * - Handle cancel_at_period_end
   * - Process pending downgrades
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRenewals() {
    this.logger.log('Processing subscription renewals...');
    const now = new Date();

    // Find active subscriptions that have passed their period end
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        current_period_end: LessThan(now),
      },
      relations: ['plan'],
    });

    for (const subscription of expiredSubscriptions) {
      try {
        if (subscription.cancel_at_period_end) {
          // Cancel the subscription
          subscription.status = SubscriptionStatus.CANCELLED;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Cancelled subscription ${subscription.id} for org ${subscription.organization_id}`,
          );
        } else if (subscription.usage_stats?.pending_downgrade_plan_id) {
          // Process pending downgrade
          subscription.plan_id = subscription.usage_stats.pending_downgrade_plan_id;
          const newStats = { ...subscription.usage_stats };
          delete newStats.pending_downgrade_plan_id;
          subscription.usage_stats = newStats;

          // Extend period by 30 days
          const periodStart = new Date(subscription.current_period_end);
          const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
          subscription.current_period_start = periodStart;
          subscription.current_period_end = periodEnd;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Downgraded subscription ${subscription.id} to plan ${subscription.plan_id}`,
          );
        } else {
          // Mark as past_due (awaiting payment for renewal)
          subscription.status = SubscriptionStatus.PAST_DUE;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Marked subscription ${subscription.id} as past_due`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error processing renewal for subscription ${subscription.id}:`,
          error,
        );
      }
    }

    this.logger.log(`Processed ${expiredSubscriptions.length} renewals`);
  }

  /**
   * Every 6 hours: Retry failed payments
   * - Find past_due subscriptions
   * - After 3 retries (9 days), suspend
   */
  @Cron('0 */6 * * *')
  async retryFailedPayments() {
    this.logger.log('Retrying failed payments...');
    const now = new Date();

    const pastDueSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.PAST_DUE,
      },
      relations: ['plan'],
    });

    for (const subscription of pastDueSubscriptions) {
      try {
        const retryCount = subscription.usage_stats?.retry_count || 0;
        const periodEnd = new Date(subscription.current_period_end);
        const daysPastDue = Math.floor(
          (now.getTime() - periodEnd.getTime()) / (24 * 60 * 60 * 1000),
        );

        if (retryCount >= 3 || daysPastDue > 14) {
          // Suspend after max retries or 14 days
          subscription.status = SubscriptionStatus.SUSPENDED;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Suspended subscription ${subscription.id} after ${retryCount} retries`,
          );
        } else {
          // Increment retry count
          subscription.usage_stats = {
            ...subscription.usage_stats,
            retry_count: retryCount + 1,
            last_retry: now.toISOString(),
          };
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Retry ${retryCount + 1}/3 for subscription ${subscription.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error retrying payment for subscription ${subscription.id}:`,
          error,
        );
      }
    }
  }

  /**
   * Daily at 10 AM: Send trial ending reminders
   * - 3 days before trial ends
   * - 1 day before trial ends
   * - Trial expired
   */
  @Cron('0 10 * * *')
  async sendTrialReminders() {
    this.logger.log('Checking trial reminders...');
    const now = new Date();

    const trialSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.TRIAL,
      },
      relations: ['organization'],
    });

    for (const subscription of trialSubscriptions) {
      if (!subscription.trial_end) continue;

      const trialEnd = new Date(subscription.trial_end);
      const daysUntilExpiry = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );

      try {
        if (daysUntilExpiry <= 0) {
          // Trial expired - update status
          subscription.status = SubscriptionStatus.EXPIRED;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(
            `Trial expired for org ${subscription.organization_id}`,
          );
        } else if (daysUntilExpiry <= 1) {
          this.logger.log(
            `Trial ending TOMORROW for org ${subscription.organization_id}`,
          );
          // TODO: Send notification (email/push)
        } else if (daysUntilExpiry <= 3) {
          this.logger.log(
            `Trial ending in ${daysUntilExpiry} days for org ${subscription.organization_id}`,
          );
          // TODO: Send notification (email/push)
        }
      } catch (error) {
        this.logger.error(
          `Error processing trial reminder for subscription ${subscription.id}:`,
          error,
        );
      }
    }
  }
}
