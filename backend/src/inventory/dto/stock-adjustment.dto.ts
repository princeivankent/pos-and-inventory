import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';

export enum AdjustmentType {
  STOCK_IN = 'stock_in',
  STOCK_OUT = 'stock_out',
}

export class StockAdjustmentDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unit_cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
