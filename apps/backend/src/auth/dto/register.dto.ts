import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../password.policy';

export const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ\s'-]+$/;
export const NAME_MESSAGE = 'El nombre solo puede contener letras, espacios, guiones y apóstrofes.';

export class RegisterDto {
  @IsString({ message: 'Escribe tu nombre.' })
  @MinLength(2, { message: 'Escribe tu nombre (mínimo 2 letras).' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  @Matches(NAME_PATTERN, { message: NAME_MESSAGE })
  name: string;

  @IsEmail({}, { message: 'Escribe un correo electrónico válido.' })
  @MaxLength(180, { message: 'El correo electrónico no puede superar los 180 caracteres.' })
  email: string;

  @IsString()
  @Matches(new RegExp(PASSWORD_PATTERN), { message: PASSWORD_MESSAGE })
  @MaxLength(128, { message: 'La contraseña es demasiado larga.' })
  password: string;
}

