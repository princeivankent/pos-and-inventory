import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    storeId: string,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      store_id: storeId,
    });
    return await this.categoryRepository.save(category);
  }

  async findAllByStore(storeId: string): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { store_id: storeId },
      relations: ['parent'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['parent'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    storeId: string,
  ): Promise<Category> {
    const category = await this.findOne(id, storeId);
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const category = await this.findOne(id, storeId);
    await this.categoryRepository.remove(category);
  }
}
