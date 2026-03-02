import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateUpgradeIntentDto {
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;
}

