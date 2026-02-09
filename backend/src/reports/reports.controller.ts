import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';

function localDateString(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions(Permission.REPORTS_VIEW)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesSummary(
    @CurrentStore() storeId: string,
    @Query('period') period = 'daily',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getSalesSummary(
      storeId,
      period,
      date || localDateString(),
    );
  }

  @Get('inventory')
  getInventoryReport(@CurrentStore() storeId: string) {
    return this.reportsService.getInventoryReport(storeId);
  }

  @Get('best-selling')
  getBestSelling(
    @CurrentStore() storeId: string,
    @Query('period') period = 'monthly',
    @Query('date') date?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.getBestSelling(
      storeId,
      period,
      date || localDateString(),
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('profit')
  getProfitReport(
    @CurrentStore() storeId: string,
    @Query('period') period = 'daily',
    @Query('date') date?: string,
  ) {
    return this.reportsService.getProfitReport(
      storeId,
      period,
      date || localDateString(),
    );
  }
}
