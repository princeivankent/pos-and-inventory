import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { UsageLimitGuard } from '../common/guards/usage-limit.guard';
import { CheckLimit } from '../common/decorators/check-limit.decorator';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('stores')
@UseGuards(AuthGuard('jwt'))
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard, UsageLimitGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.STORES_MANAGE)
  @CheckLimit({ resource: 'stores' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    // Return only stores the user has access to
    return this.storesService.getUserStores(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.STORES_MANAGE)
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Patch(':id/settings')
  @UseGuards(TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.STORES_MANAGE)
  updateSettings(
    @Param('id') id: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.storesService.updateSettings(id, settings);
  }

  @Delete(':id')
  @UseGuards(TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.STORES_MANAGE)
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
