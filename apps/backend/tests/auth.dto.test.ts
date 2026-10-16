import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { LoginDto } from '../src/auth/dto/login.dto';
import { RecoverDto } from '../src/auth/dto/recover.dto';
import { ResetDto } from '../src/auth/dto/reset.dto';
import { DeleteAccountDto } from '../src/auth/dto/delete-account.dto';

describe('Backend DTO Validations - Casos de Éxito y Fracaso', () => {
  describe('RegisterDto', () => {
    test('éxito: acepta nombre válido con acentos, espacios y guiones', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'María José O\'Connor-García',
        email: 'maria.jose@ejemplo.com',
        password: 'Password123!',
      });
      const errors = await validate(dto);
      assert.equal(errors.length, 0);
    });

    test('éxito: acepta longitudes mínimas y máximas permitidas', async () => {
      const dtoMin = plainToInstance(RegisterDto, {
        name: 'Al', // 2 caracteres
        email: 'a@b.co',
        password: 'Password1!',
      });
      const errorsMin = await validate(dtoMin);
      assert.equal(errorsMin.length, 0);

      const maxName = 'A'.repeat(120);
      const dtoMax = plainToInstance(RegisterDto, {
        name: maxName,
        email: `${'a'.repeat(50)}@ejemplo.com`,
        password: 'Password1!',
      });
      const errorsMax = await validate(dtoMax);
      assert.equal(errorsMax.length, 0);
    });

    test('fracaso: rechaza nombre menor a 2 caracteres', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'A',
        email: 'valido@ejemplo.com',
        password: 'Password1!',
      });
      const errors = await validate(dto);
      assert.ok(errors.some((e) => e.property === 'name'));
    });

    test('fracaso: rechaza nombre que excede los 120 caracteres', async () => {
      const dto = plainToInstance(RegisterDto, {
        name: 'A'.repeat(121),
        email: 'valido@ejemplo.com',
        password: 'Password1!',
      });
      const errors = await validate(dto);
      assert.ok(errors.some((e) => e.property === 'name'));
    });

    test('fracaso: rechaza nombre con números o caracteres inválidos', async () => {
      for (const invalidName of ['Juan123', 'Pedro<script>', 'Carlos@work', 'Luis_Gomez', 'Elena$']) {
        const dto = plainToInstance(RegisterDto, {
          name: invalidName,
          email: 'valido@ejemplo.com',
          password: 'Password1!',
        });
        const errors = await validate(dto);
        assert.ok(errors.some((e) => e.property === 'name'), `Debería fallar con: ${invalidName}`);
      }
    });

    test('fracaso: rechaza correos con formato inválido o longitud mayor a 180', async () => {
      const dtoInvalidEmail = plainToInstance(RegisterDto, {
        name: 'Pedro Perez',
        email: 'no-es-correo',
        password: 'Password1!',
      });
      const errors = await validate(dtoInvalidEmail);
      assert.ok(errors.some((e) => e.property === 'email'));

      const dtoLongEmail = plainToInstance(RegisterDto, {
        name: 'Pedro Perez',
        email: `${'a'.repeat(180)}@test.com`,
        password: 'Password1!',
      });
      const errorsLong = await validate(dtoLongEmail);
      assert.ok(errorsLong.some((e) => e.property === 'email'));
    });

    test('fracaso: rechaza contraseñas débiles o que no cumplen la política', async () => {
      const weakPasswords = [
        'corta', // < 8
        'solominusculas1!', // sin mayúsculas
        'SOLOMAYUSCULAS1!', // sin minúsculas
        'SinNumerosNiSimbolo', // sin números ni símbolos
        'ConNumero1SinSimbolo', // sin símbolo
        'ConSimbolo!SinNumero', // sin número
        'A'.repeat(129), // > 128
      ];

      for (const pass of weakPasswords) {
        const dto = plainToInstance(RegisterDto, {
          name: 'Usuario Prueba',
          email: 'prueba@ejemplo.com',
          password: pass,
        });
        const errors = await validate(dto);
        assert.ok(errors.some((e) => e.property === 'password'), `Debería fallar contraseña: ${pass}`);
      }
    });
  });

  describe('LoginDto', () => {
    test('éxito: credenciales válidas', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'usuario@ejemplo.com',
        password: 'Password1!',
      });
      const errors = await validate(dto);
      assert.equal(errors.length, 0);
    });

    test('fracaso: correo inválido o contraseña vacía', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalido',
        password: '',
      });
      const errors = await validate(dto);
      assert.ok(errors.some((e) => e.property === 'email'));
      assert.ok(errors.some((e) => e.property === 'password'));
    });
  });

  describe('DeleteAccountDto (Cancelaciones)', () => {
    test('éxito: permite cancelación con contraseña o con correo de confirmación', async () => {
      const dtoPass = plainToInstance(DeleteAccountDto, { password: 'Password1!' });
      assert.equal((await validate(dtoPass)).length, 0);

      const dtoEmail = plainToInstance(DeleteAccountDto, { confirmEmail: 'user@ejemplo.com' });
      assert.equal((await validate(dtoEmail)).length, 0);
    });

    test('fracaso: contraseña que excede el límite máximo', async () => {
      const dto = plainToInstance(DeleteAccountDto, { password: 'P'.repeat(129) });
      const errors = await validate(dto);
      assert.ok(errors.some((e) => e.property === 'password'));
    });
  });

  describe('ResetDto y RecoverDto', () => {
    test('éxito: RecoverDto con correo válido', async () => {
      const dto = plainToInstance(RecoverDto, { email: 'recupera@ejemplo.com' });
      assert.equal((await validate(dto)).length, 0);
    });

    test('fracaso: RecoverDto con correo inválido', async () => {
      const dto = plainToInstance(RecoverDto, { email: 'no-correo' });
      const errors = await validate(dto);
      assert.ok(errors.some((e) => e.property === 'email'));
    });

    test('éxito: ResetDto con código de 6 dígitos y contraseña segura', async () => {
      const dto = plainToInstance(ResetDto, {
        email: 'recupera@ejemplo.com',
        code: '123456',
        newPassword: 'NuevaPassword1!',
      });
      assert.equal((await validate(dto)).length, 0);
    });

    test('fracaso: ResetDto con código de longitud distinta a 6', async () => {
      const dtoShort = plainToInstance(ResetDto, {
        email: 'recupera@ejemplo.com',
        code: '123',
        newPassword: 'NuevaPassword1!',
      });
      const errors = await validate(dtoShort);
      assert.ok(errors.some((e) => e.property === 'code'));
    });
  });
});
