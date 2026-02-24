import {
  BadRequestException,
  ForbiddenException,
  ExecutionContext,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantGuard } from './tenant.guard';
import { UserRole } from '../../database/entities/user-store.entity';

describe('TenantGuard', () => {
  const createContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  it('throws when request has no authenticated user', async () => {
    const repo = { findOne: jest.fn() } as unknown as Repository<any>;
    const guard = new TenantGuard(repo);
    const context = createContext({
      headers: { 'x-store-id': 'store-1' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('throws when x-store-id header is missing', async () => {
    const repo = { findOne: jest.fn() } as unknown as Repository<any>;
    const guard = new TenantGuard(repo);
    const context = createContext({
      user: { userId: 'user-1' },
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('injects tenant role/permissions when user has store access', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({
        role: UserRole.ADMIN,
        permissions: ['sales:create', 'sales:view'],
      }),
    } as unknown as Repository<any>;
    const guard = new TenantGuard(repo);

    const request: any = {
      user: { userId: 'user-1' },
      headers: { 'x-store-id': 'store-1' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { user_id: 'user-1', store_id: 'store-1' },
    });
    expect(request.user.storeId).toBe('store-1');
    expect(request.user.role).toBe(UserRole.ADMIN);
    expect(request.user.permissions).toEqual(['sales:create', 'sales:view']);
  });
});
