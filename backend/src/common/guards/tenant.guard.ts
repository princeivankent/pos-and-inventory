import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStore } from '../../database/entities/user-store.entity';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const storeId = request.headers['x-store-id'] as string;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!storeId) {
      throw new BadRequestException('Store ID is required');
    }

    // Verify user has access to the requested store
    const userStore = await this.userStoreRepository.findOne({
      where: {
        user_id: user.userId,
        store_id: storeId,
      },
    });

    if (!userStore) {
      throw new ForbiddenException('Access to this store is denied');
    }

    // Inject store context into request
    request.user.storeId = storeId;
    request.user.role = userStore.role;

    return true;
  }
}
