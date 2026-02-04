import { IsNotEmpty, IsUUID } from 'class-validator';

export class SwitchStoreDto {
  @IsUUID()
  @IsNotEmpty()
  storeId: string;
}
