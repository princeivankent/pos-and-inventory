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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';

@Controller('categories')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentStore() storeId: string,
  ) {
    return this.categoriesService.create(createCategoryDto, storeId);
  }

  @Get()
  @RequirePermissions(Permission.PRODUCTS_VIEW)
  findAll(@CurrentStore() storeId: string) {
    return this.categoriesService.findAllByStore(storeId);
  }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTS_VIEW)
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.categoriesService.findOne(id, storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentStore() storeId: string,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  remove(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.categoriesService.remove(id, storeId);
  }
}
