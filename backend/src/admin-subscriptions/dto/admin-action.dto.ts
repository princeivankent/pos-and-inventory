import { IsOptional, IsString } from 'class-validator';

export class AdminActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

