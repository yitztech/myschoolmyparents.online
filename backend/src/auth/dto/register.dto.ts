import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../password.policy';

export class RegisterDto {
  @IsString({ message: 'Escribe tu nombre.' })
  @MinLength(2, { message: 'Escribe tu nombre (mínimo 2 letras).' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  name: string;

  @IsEmail({}, { message: 'Escribe un correo electrónico válido.' })
  @MaxLength(180)
  email: string;

  @IsString()
  @Matches(new RegExp(PASSWORD_PATTERN), { message: PASSWORD_MESSAGE })
  @MaxLength(128, { message: 'La contraseña es demasiado larga.' })
  password: string;
}
