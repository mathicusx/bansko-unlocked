import {
  IsString,
  IsEmail,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  ArrayMinSize,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * First-touch attribution captured by the Angular AttributionService on the
 * visitor's first landing. Optional — older app versions and bot traffic may
 * omit it. Persisted in the bookings row so commission against SEO/AI traffic
 * can be reconciled.
 */
export class AttributionDto {
  @IsString()
  @MaxLength(40)
  channel: string;

  @IsString()
  @MaxLength(120)
  source: string;

  @IsString()
  @MaxLength(60)
  medium: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  landingPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  gclid?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fbclid?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  msclkid?: string | null;

  @IsOptional()
  @IsDateString()
  capturedAt?: string;
}

/**
 * Payload the Angular checkout dialog POSTs to /api/bookings after PayPal
 * captures the deposit. The browser is untrusted, so every field is validated
 * here (main.ts runs a whitelisting ValidationPipe, so unknown keys are
 * stripped).
 */
export class CreateBookingDto {
  @IsOptional()
  @IsString()
  tourId?: string;

  @IsOptional()
  @IsString()
  tourSlug?: string;

  @IsString()
  @MaxLength(200)
  tourTitle: string;

  @IsString()
  @MaxLength(120)
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @MaxLength(40)
  customerPhone: string;

  @IsIn(['whatsapp', 'phone', 'email', 'other'])
  preferredContact: 'whatsapp' | 'phone' | 'email' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredContactOther?: string;

  // One or more levels — groups can be mixed. At least one is required.
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['beginner', 'intermediate', 'advanced'], { each: true })
  experienceLevels: ('beginner' | 'intermediate' | 'advanced')[];

  @IsInt()
  @Min(1)
  @Max(20)
  numberOfRiders: number;

  @IsString()
  @MaxLength(200)
  preferredDates: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extras?: string[];

  @IsNumber()
  @Min(0)
  depositAmount: number;

  @IsString()
  @MaxLength(3)
  currency: string;

  @IsOptional()
  @IsString()
  paypalOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  locale?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AttributionDto)
  attribution?: AttributionDto;
}
