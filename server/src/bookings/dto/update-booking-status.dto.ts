import { IsIn, IsOptional, IsString } from 'class-validator';

/** Admin-only: PATCH /api/bookings/:id/status. Optional `timestamp` overrides
 *  the auto-derived completedAt/cancelledAt (defaults to now). */
export class UpdateBookingStatusDto {
  @IsIn(['pending', 'completed', 'no-show', 'cancelled'])
  status: 'pending' | 'completed' | 'no-show' | 'cancelled';

  @IsOptional()
  @IsString()
  timestamp?: string;
}
