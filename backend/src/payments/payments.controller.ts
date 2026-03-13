import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/entities/user-store.entity';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { PaymentsService } from './payments.service';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { CreateUpgradeIntentDto } from './dto/create-upgrade-intent.dto';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('invoices')
  getInvoices(@CurrentUser() user: RequestUser) {
    return this.paymentsService.getInvoices(user.organizationId);
  }

  @Get('history')
  getPayments(@CurrentUser() user: RequestUser) {
    return this.paymentsService.getPayments(user.organizationId);
  }

  @Post('invoices/:id/pay')
  payInvoice(@Param('id') id: string) {
    return this.paymentsService.payInvoice(id);
  }

  @Post('intents')
  createUpgradeIntent(
    @Body() dto: CreateUpgradeIntentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.paymentsService.createUpgradePaymentIntent(user.organizationId, dto.plan_id, dto.billing_period);
  }

  @Get('methods')
  getPaymentMethods(@CurrentUser() user: RequestUser) {
    return this.paymentsService.getPaymentMethods(user.organizationId);
  }
}
