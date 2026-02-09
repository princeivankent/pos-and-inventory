import { IsArray, IsEnum } from 'class-validator';
import { Permission } from '../../common/permissions/permission.enum';

export class UpdatePermissionsDto {
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
