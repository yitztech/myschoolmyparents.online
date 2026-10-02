import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Escribe un correo electrónico válido.' })
  @MaxLength(180)
  email: string;

  @IsString({ message: 'Escribe tu contraseña.' })
  @MinLength(1, { message: 'Escribe tu contraseña.' })
  @MaxLength(128)
  password: string;
}
