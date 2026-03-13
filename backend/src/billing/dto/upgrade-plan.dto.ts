import { IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export class UpgradePlanDto {
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;

  @IsOptional()
  @IsUUID()
  payment_id?: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billing_period?: 'monthly' | 'annual';
}
