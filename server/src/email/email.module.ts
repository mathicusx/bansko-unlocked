import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResendService } from './resend.service';

/**
 * Global wrapper around the Resend client. Marked @Global so every feature
 * module (bookings, contact, …) can inject ResendService without each one
 * having to import EmailModule individually.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [ResendService],
  exports: [ResendService],
})
export class EmailModule {}
