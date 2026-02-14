import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpgradePlanDto {
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;
}
