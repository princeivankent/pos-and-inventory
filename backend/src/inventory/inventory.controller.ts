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
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @Roles(UserRole.ADMIN)
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
  getLowStock(@CurrentStore() storeId: string) {
    return this.inventoryService.getLowStock(storeId);
  }

  @Get('movements')
  getMovements(
    @CurrentStore() storeId: string,
    @Query('product_id') productId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getMovements(
      storeId,
      productId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
