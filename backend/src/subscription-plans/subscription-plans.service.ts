import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async findAll() {
    return this.planRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async findByCode(planCode: string) {
    return this.planRepository.findOne({
      where: { plan_code: planCode, is_active: true },
    });
  }

  async findById(id: string) {
    return this.planRepository.findOne({
      where: { id, is_active: true },
    });
  }
}
