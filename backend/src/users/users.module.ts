import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../database/entities/user.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';
import { UsageLimitGuardModule } from '../common/guards/usage-limit-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserStore]),
    AuthModule,
    SubscriptionGuardModule,
    UsageLimitGuardModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
