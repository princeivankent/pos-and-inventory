import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_STATUSES = ['trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired'] as const;
const ALLOWED_PLANS = ['tindahan', 'negosyo', 'kadena'] as const;

export class ListSubscriptionsDto {
  @IsOptional()
  @IsIn(ALLOWED_STATUSES)
  status?: (typeof ALLOWED_STATUSES)[number];

  @IsOptional()
  @IsIn(ALLOWED_PLANS)
  plan_code?: (typeof ALLOWED_PLANS)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

