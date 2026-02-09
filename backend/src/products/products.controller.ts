import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { UserRole } from '../database/entities/user-store.entity';
import { Permission } from '../common/permissions/permission.enum';

@Controller('products')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentStore() storeId: string,
  ) {
    return this.productsService.create(createProductDto, storeId);
  }

  @Get()
  @RequirePermissions(Permission.PRODUCTS_VIEW)
  findAll(
    @CurrentStore() storeId: string,
    @Query('category_id') categoryId?: string,
  ) {
    return this.productsService.findAllByStore(storeId, categoryId);
  }

  @Get('search')
  @RequirePermissions(Permission.PRODUCTS_VIEW)
  search(@CurrentStore() storeId: string, @Query('q') query: string) {
    return this.productsService.search(storeId, query || '');
  }

  @Get(':id')
  @RequirePermissions(Permission.PRODUCTS_VIEW)
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.productsService.findOne(id, storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentStore() storeId: string,
  ) {
    return this.productsService.update(id, updateProductDto, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  remove(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.productsService.remove(id, storeId);
  }
}
