import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discount?: number;
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discount_amount?: number;

  @IsEnum(DiscountType)
  @IsOptional()
  discount_type?: DiscountType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount_paid: number;

  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  credit_amount?: number;

  @IsString()
  @IsOptional()
  payment_notes?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
