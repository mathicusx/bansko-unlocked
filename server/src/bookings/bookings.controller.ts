import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService, BookingStats } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking } from './booking.entity';

/**
 * Public + admin endpoints for the booking flow.
 *
 *   Public:
 *     POST /api/bookings              — Persist a paid booking + dispatch emails
 *     GET  /api/bookings/stats        — Quota-gated social-proof stats
 *
 *   Admin (JWT):
 *     GET   /api/bookings/admin/all                    — Full booking list
 *     GET   /api/bookings/admin/summary?from&to&rate   — Commission report
 *     PATCH /api/bookings/:id/status                   — Lifecycle transition
 */
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateBookingDto): Promise<{ id: string }> {
    const booking = await this.bookings.create(dto);
    return { id: booking.id };
  }

  @Get('stats')
  getStats(): Promise<BookingStats> {
    return this.bookings.getStats();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllForAdmin(): Promise<Booking[]> {
    return this.bookings.findAllForAdmin();
  }

  /**
   * Commission summary. Defaults to current calendar month, 3% rate, AI+organic
   * scope — matches the partnership agreement so the page works with no params.
   */
  @Get('admin/summary')
  @UseGuards(JwtAuthGuard)
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('rate') rate?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(to) : defaultTo;
    const rateNum = rate ? Number(rate) : 0.03;
    return this.bookings.getCommissionSummary(fromDate, toDate, rateNum);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();
    try {
      return await this.bookings.setStatus(id, dto.status, timestamp);
    } catch {
      throw new NotFoundException(`Booking ${id} not found`);
    }
  }
}
