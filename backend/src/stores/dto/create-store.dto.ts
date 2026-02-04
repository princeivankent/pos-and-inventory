import { IsNotEmpty, IsString, IsOptional, IsEmail, IsObject } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  tax_id?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
