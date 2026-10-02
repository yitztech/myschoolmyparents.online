import { IsEmail, MaxLength } from 'class-validator';

export class RecoverDto {
  @IsEmail({}, { message: 'Escribe el correo con el que te registraste.' })
  @MaxLength(180)
  email: string;
}
