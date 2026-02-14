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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { FeatureGateGuard } from '../common/guards/feature-gate.guard';
import { UsageLimitGuard } from '../common/guards/usage-limit.guard';
import { CheckLimit } from '../common/decorators/check-limit.decorator';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';

@Controller('users')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard, UsageLimitGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions(Permission.USERS_MANAGE)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.usersService.findAllByStore(storeId);
  }

  @Get('permissions/available')
  getAvailablePermissions() {
    return this.usersService.getAvailablePermissions();
  }

  @Post()
  @CheckLimit({ resource: 'users' })
  create(@Body() createUserDto: CreateUserDto, @CurrentStore() storeId: string) {
    return this.usersService.create(createUserDto, storeId);
  }

  @Get(':id/permissions')
  getUserPermissions(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ) {
    return this.usersService.getUserPermissions(id, storeId);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
    @CurrentStore() storeId: string,
  ) {
    return this.usersService.updatePermissions(id, updatePermissionsDto, storeId);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentStore() storeId: string,
  ) {
    return this.usersService.updateRole(id, updateUserRoleDto, storeId);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.usersService.deactivate(id, storeId);
  }
}
