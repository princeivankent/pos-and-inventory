import { IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';

export class CreateUpgradeIntentDto {
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billing_period?: 'monthly' | 'annual';
}

