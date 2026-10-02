import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../password.policy';

export class ResetDto {
  @IsEmail({}, { message: 'Escribe un correo electrónico válido.' })
  @MaxLength(180)
  email: string;

  @IsString({ message: 'Escribe el código que te enviamos.' })
  @Length(6, 6, { message: 'El código tiene 6 dígitos.' })
  code: string;

  @IsString()
  @Matches(new RegExp(PASSWORD_PATTERN), { message: PASSWORD_MESSAGE })
  @MaxLength(128)
  newPassword: string;
}
