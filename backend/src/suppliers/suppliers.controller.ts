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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';

@Controller('suppliers')
@UseGuards(
  AuthGuard('jwt'),
  TenantGuard,
  SubscriptionGuard,
  RolesGuard,
  PermissionsGuard,
  FeatureGateGuard,
)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions(Permission.SUPPLIERS_VIEW)
  findAll(
    @CurrentStore() storeId: string,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAllByStore(storeId, search);
  }

  @Get(':id')
  @RequirePermissions(Permission.SUPPLIERS_VIEW)
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.suppliersService.findOne(id, storeId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.SUPPLIERS_MANAGE)
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentStore() storeId: string,
  ) {
    return this.suppliersService.create(dto, storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.SUPPLIERS_MANAGE)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentStore() storeId: string,
  ) {
    return this.suppliersService.update(id, dto, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.SUPPLIERS_MANAGE)
  deactivate(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.suppliersService.deactivate(id, storeId);
  }
}
