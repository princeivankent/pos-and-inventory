import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from '../database/entities/category.entity';
import { UserStore } from '../database/entities/user-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, UserStore])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
