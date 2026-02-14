import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class RecordPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsUUID()
  @IsOptional()
  sale_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
