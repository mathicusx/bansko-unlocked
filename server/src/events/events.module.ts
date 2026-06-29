import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsController } from './events.controller';
import { MetaCapiService } from './meta-capi.service';

@Module({
  imports: [ConfigModule],
  controllers: [EventsController],
  providers: [MetaCapiService],
})
export class EventsModule {}
