import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload the Angular contact form / floating-help bubble POST to
 * /api/contact. The global ValidationPipe (whitelist:true) strips unknown
 * keys, so it's safe to mirror the browser input here without re-shaping.
 */
export class CreateContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  /** Used to pick the confirmation-email language. English-only for now. */
  @IsOptional()
  @IsIn(['en'])
  locale?: 'en';

  /**
   * Where the visitor submitted from — 'contact-page' or 'floating-help'.
   * Surfaced in the staff notification subject so the inbox can tell which
   * surface drove the lead without parsing the body.
   */
  @IsOptional()
  @IsIn(['contact-page', 'floating-help'])
  source?: 'contact-page' | 'floating-help';
}
