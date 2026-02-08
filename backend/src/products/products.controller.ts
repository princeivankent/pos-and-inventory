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
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities/user-store.entity';

@Controller('products')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentStore() storeId: string,
  ) {
    return this.productsService.create(createProductDto, storeId);
  }

  @Get()
  findAll(
    @CurrentStore() storeId: string,
    @Query('category_id') categoryId?: string,
  ) {
    return this.productsService.findAllByStore(storeId, categoryId);
  }

  @Get('search')
  search(@CurrentStore() storeId: string, @Query('q') query: string) {
    return this.productsService.search(storeId, query || '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.productsService.findOne(id, storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentStore() storeId: string,
  ) {
    return this.productsService.update(id, updateProductDto, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentStore() storeId: string) {
    return this.productsService.remove(id, storeId);
  }
}
