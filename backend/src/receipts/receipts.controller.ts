import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { Permission } from '../common/permissions/permission.enum';

@Controller('receipts')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard)
@RequirePermissions(Permission.RECEIPTS_VIEW)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':saleId')
  getReceiptData(
    @Param('saleId') saleId: string,
    @CurrentStore() storeId: string,
  ) {
    return this.receiptsService.getReceiptData(saleId, storeId);
  }

  @Get(':saleId/pdf')
  async getReceiptPdf(
    @Param('saleId') saleId: string,
    @CurrentStore() storeId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.receiptsService.generatePdf(saleId, storeId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${saleId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
