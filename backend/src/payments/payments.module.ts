import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymongoWebhookController } from './paymongo/paymongo-webhook.controller';
import { MockPaymentService } from './mock/mock-payment.service';
import { PaymongoService } from './paymongo/paymongo.service';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { Invoice } from '../database/entities/invoice.entity';
import { Payment } from '../database/entities/payment.entity';
import { BillingPaymentMethod } from '../database/entities/payment-method.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { Store } from '../database/entities/store.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Payment,
      BillingPaymentMethod,
      Subscription,
      SubscriptionPlan,
      UserStore,
      Store,
    ]),
    ConfigModule,
    SubscriptionGuardModule,
  ],
  controllers: [PaymentsController, PaymongoWebhookController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_GATEWAY,
      useFactory: (configService: ConfigService) => {
        const paymongoKey = configService.get<string>('PAYMONGO_SECRET_KEY');
        if (paymongoKey) {
          return new PaymongoService(configService);
        }
        return new MockPaymentService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [PaymentsService, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
