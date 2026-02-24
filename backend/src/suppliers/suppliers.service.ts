import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Supplier } from '../database/entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto, storeId: string): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...dto,
      store_id: storeId,
      is_active: true,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAllByStore(storeId: string, search?: string): Promise<Supplier[]> {
    const where: any = { store_id: storeId, is_active: true };

    if (search && search.trim()) {
      return this.supplierRepository.find({
        where: [
          { ...where, name: ILike(`%${search.trim()}%`) },
          { ...where, phone: ILike(`%${search.trim()}%`) },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.supplierRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, store_id: storeId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    storeId: string,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, storeId);
    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  async deactivate(id: string, storeId: string): Promise<Supplier> {
    const supplier = await this.findOne(id, storeId);
    supplier.is_active = false;
    return this.supplierRepository.save(supplier);
  }
}
