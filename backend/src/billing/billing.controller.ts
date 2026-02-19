import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { UserRole } from '../database/entities/user-store.entity';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { SubscriptionService } from './subscription.service';
import { UsageTrackerService } from './usage-tracker.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
export class BillingController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly usageTrackerService: UsageTrackerService,
  ) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: RequestUser) {
    return this.subscriptionService.getSubscriptionInfo(user.organizationId);
  }

  @Get('usage')
  getUsage(@CurrentUser() user: RequestUser) {
    return this.subscriptionService.getUsage(user.organizationId);
  }

  @Post('upgrade')
  upgrade(
    @Body() dto: UpgradePlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subscriptionService.upgradePlan(
      user.organizationId,
      dto.plan_id,
    );
  }

  @Post('downgrade')
  downgrade(
    @Body() dto: UpgradePlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subscriptionService.downgradePlan(
      user.organizationId,
      dto.plan_id,
    );
  }

  @Post('cancel')
  cancel(
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.subscriptionService.cancelSubscription(
      user.organizationId,
      dto.immediate,
    );
  }
}
