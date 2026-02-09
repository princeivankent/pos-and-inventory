import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('sales')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequirePermissions(Permission.SALES_CREATE)
  create(
    @Body() createSaleDto: CreateSaleDto,
    @CurrentStore() storeId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.create(createSaleDto, storeId, user.userId);
  }

  @Get('daily')
  @RequirePermissions(Permission.SALES_VIEW)
  findDailySales(
    @CurrentStore() storeId: string,
    @Query('date') date?: string,
  ) {
    const now = new Date();
    const targetDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return this.salesService.findDailySales(storeId, targetDate);
  }

  @Get(':id')
  @RequirePermissions(Permission.SALES_VIEW)
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.salesService.findOne(id, storeId);
  }

  @Post(':id/void')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.SALES_VOID)
  voidSale(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.salesService.voidSale(id, storeId, user.userId);
  }
}
