import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ToursModule } from './tours/tours.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { ContactModule } from './contact/contact.module';
import { EmailModule } from './email/email.module';
import { HealthController } from './health.controller';
import { Tour } from './tours/tour.entity';
import { User } from './users/user.entity';
import { Booking } from './bookings/booking.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 600_000, max: 100 }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          entities: [Tour, User, Booking],
          synchronize: !isProd,
          ssl: isProd ? { rejectUnauthorized: false } : false,
          extra: { max: 5 },
        };
      },
    }),
    EmailModule,
    AuthModule,
    ToursModule,
    UsersModule,
    EventsModule,
    BookingsModule,
    ContactModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
