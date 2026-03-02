import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UpgradePlanDto {
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;

  @IsOptional()
  @IsUUID()
  payment_id?: string;
}
