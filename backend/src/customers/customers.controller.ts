import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(Permission.CUSTOMERS_VIEW)
  findAll(
    @CurrentStore() storeId: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAllByStore(storeId, search);
  }

  @Get(':id')
  @RequirePermissions(Permission.CUSTOMERS_VIEW)
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.customersService.findOne(id, storeId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.CUSTOMERS_MANAGE)
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentStore() storeId: string,
  ) {
    return this.customersService.create(dto, storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.CUSTOMERS_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentStore() storeId: string,
  ) {
    return this.customersService.update(id, dto, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.CUSTOMERS_MANAGE)
  deactivate(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.customersService.deactivate(id, storeId);
  }

  @Get(':id/statement')
  @RequirePermissions(Permission.CUSTOMERS_VIEW)
  @RequireFeature('utang_management')
  getStatement(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.customersService.getCreditStatement(id, storeId);
  }

  @Post(':id/payments')
  @RequirePermissions(Permission.CUSTOMERS_MANAGE)
  @RequireFeature('utang_management')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentStore() storeId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.customersService.recordPayment(id, dto, storeId, user.userId);
  }
}
