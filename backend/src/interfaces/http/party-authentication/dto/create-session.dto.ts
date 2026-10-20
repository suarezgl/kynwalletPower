import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, normalizeEmail } from '../../../../domain/credentials/credentials.js';

export class CreateSessionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(EMAIL_MAX_LENGTH)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
