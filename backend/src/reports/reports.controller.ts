import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permission } from '../common/permissions/permission.enum';

function localDateString(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions(Permission.SALES_VIEW)
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
  @RequirePermissions(Permission.REPORTS_VIEW)
  getInventoryReport(@CurrentStore() storeId: string) {
    return this.reportsService.getInventoryReport(storeId);
  }

  @Get('best-selling')
  @RequirePermissions(Permission.REPORTS_VIEW)
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
  @RequirePermissions(Permission.REPORTS_VIEW)
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
