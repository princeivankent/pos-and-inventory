import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../database/entities/user-store.entity';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
