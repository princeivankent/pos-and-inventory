import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';
import { AdminActionDto } from './dto/admin-action.dto';
import { AdminChangePlanDto } from './dto/admin-change-plan.dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), PlatformAdminGuard)
export class AdminSubscriptionsController {
  constructor(private readonly adminSubscriptionsService: AdminSubscriptionsService) {}

  @Get('subscriptions')
  listSubscriptions(@Query() query: ListSubscriptionsDto) {
    return this.adminSubscriptionsService.listSubscriptions(query);
  }

  @Get('subscriptions/:organizationId')
  getSubscriptionDetail(@Param('organizationId') organizationId: string) {
    return this.adminSubscriptionsService.getSubscriptionDetail(organizationId);
  }

  @Get('invoices')
  listInvoices(
    @Query('status') status?: string,
    @Query('organization_id') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminSubscriptionsService.listInvoices({
      status,
      organization_id: organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('payments')
  listPayments(
    @Query('status') status?: string,
    @Query('organization_id') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminSubscriptionsService.listPayments({
      status,
      organization_id: organizationId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('subscriptions/:organizationId/suspend')
  suspend(
    @Param('organizationId') organizationId: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminSubscriptionsService.suspendSubscription(organizationId, user.userId, dto.reason);
  }

  @Post('subscriptions/:organizationId/reactivate')
  reactivate(
    @Param('organizationId') organizationId: string,
    @Body() dto: AdminActionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminSubscriptionsService.reactivateSubscription(organizationId, user.userId, dto.reason);
  }

  @Post('subscriptions/:organizationId/change-plan')
  changePlan(
    @Param('organizationId') organizationId: string,
    @Body() dto: AdminChangePlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.adminSubscriptionsService.changePlan(
      organizationId,
      dto.plan_id,
      user.userId,
      dto.reason,
    );
  }
}

