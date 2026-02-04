import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    StoresModule,
    // TODO: Add remaining modules as they are implemented
    // ProductsModule,
    // CategoriesModule,
    // SuppliersModule,
    // InventoryModule,
    // CustomersModule,
    // SalesModule,
    // ReportsModule,
    // AlertsModule,
    // ReceiptsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
