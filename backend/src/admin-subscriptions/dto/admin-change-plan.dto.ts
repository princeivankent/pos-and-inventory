import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdminChangePlanDto {
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

