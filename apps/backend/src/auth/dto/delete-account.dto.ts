import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Confirmación para borrar la cuenta: la contraseña si la cuenta la tiene;
 * si no (cuenta creada con Google), el correo de la cuenta. El servicio
 * decide cuál exige.
 */
export class DeleteAccountDto {
  @IsOptional()
  @IsString({ message: 'Escribe tu contraseña para confirmar.' })
  @MinLength(1, { message: 'Escribe tu contraseña para confirmar.' })
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsString({ message: 'Escribe el correo de tu cuenta para confirmar.' })
  @MaxLength(180)
  confirmEmail?: string;
}
