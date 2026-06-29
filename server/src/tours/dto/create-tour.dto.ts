import { IsString, IsNumber, IsOptional, IsArray, IsIn, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TourDayDto {
  @IsNumber()
  day: number;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  image: string;
}

export class CreateTourDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  description: string;

  @IsIn(['enduro', 'buggy'])
  type: 'enduro' | 'buggy';

  @IsNumber()
  priceEur: number;

  @IsNumber()
  priceGbp: number;

  @IsOptional()
  @IsNumber()
  promoPriceEur?: number;

  @IsOptional()
  @IsNumber()
  promoPriceGbp?: number;

  @IsOptional()
  @IsString()
  promoEndDate?: string;

  @IsOptional()
  @IsString()
  promoBookingPeriod?: string;

  @IsOptional()
  @IsString()
  promo?: string;

  @IsString()
  image: string;

  @IsString()
  duration: string;

  @IsString()
  durationDetails: string;

  @IsString()
  averageDistance: string;

  @IsArray()
  @IsString({ each: true })
  difficulty: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourDayDto)
  tourDetails: TourDayDto[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
