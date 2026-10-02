import { IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString({ message: 'Escribe tu contraseña para confirmar.' })
  @MinLength(1, { message: 'Escribe tu contraseña para confirmar.' })
  @MaxLength(128)
  password: string;
}
