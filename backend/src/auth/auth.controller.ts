import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SwitchStoreDto } from './dto/switch-store.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('switch-store')
  @UseGuards(AuthGuard('jwt'))
  async switchStore(
    @CurrentUser() user: RequestUser,
    @Body() switchStoreDto: SwitchStoreDto,
  ) {
    return this.authService.switchStore(user.userId, switchStoreDto.storeId);
  }

  @Get('stores')
  @UseGuards(AuthGuard('jwt'))
  async getUserStores(@CurrentUser() user: RequestUser) {
    return this.authService.getUserStores(user.userId);
  }
}
