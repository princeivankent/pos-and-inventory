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
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities/user-store.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.usersService.findAllByStore(storeId);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @CurrentStore() storeId: string) {
    return this.usersService.create(createUserDto, storeId);
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
