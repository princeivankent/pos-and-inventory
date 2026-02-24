import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.INVENTORY_ADJUST)
  adjust(
    @Body() stockAdjustmentDto: StockAdjustmentDto,
    @CurrentStore() storeId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.inventoryService.adjust(
      stockAdjustmentDto,
      storeId,
      user.userId,
    );
  }

  @Get('low-stock')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getLowStock(@CurrentStore() storeId: string) {
    return this.inventoryService.getLowStock(storeId);
  }

  @Get('movements')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  getMovements(
    @CurrentStore() storeId: string,
    @Query('product_id') productId?: string,
    @Query('movement_type') movementType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getMovements(
      storeId,
      productId,
      movementType,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
