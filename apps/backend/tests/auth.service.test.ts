import 'reflect-metadata';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import * as bcrypt from 'bcryptjs';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/users/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService - Casos de Éxito y Fracaso', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockMailService: any;
  let mockLogger: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: async (email: string) => null,
      create: async (data: any) => {
        const u = new User();
        u.id = 'uuid-test-123';
        u.name = data.name;
        u.email = data.email;
        u.passwordHash = data.passwordHash;
        u.tokenVersion = 0;
        return u;
      },
      remove: async (id: string) => {},
      update: async (id: string, changes: any) => {},
      reserveResetAttempt: async (id: string, max: number) => true,
    };

    mockJwtService = {
      signAsync: async (payload: any) =>
        'mock-jwt-token.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.signature',
    };


    mockConfigService = {
      get: (key: string) => {
        if (key === 'jwtExpiresIn') return '7d';
        return null;
      },
    };

    mockMailService = {
      enabled: true,
      sendPasswordResetCode: async () => {},
    };


    mockLogger = {
      setContext: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    authService = new AuthService(
      mockUsersService,
      mockJwtService,
      mockConfigService,
      mockMailService,
      mockLogger,
    );
  });

  describe('Registro de usuario', () => {
    test('éxito: registra un usuario nuevo con contraseña cifrada', async () => {
      const res = await authService.register({
        name: 'Carlos Ruiz',
        email: 'carlos@ejemplo.com',
        password: 'Password123!',
      });

      assert.ok(res.token);
      assert.equal(res.user.email, 'carlos@ejemplo.com');
      assert.equal(res.user.name, 'Carlos Ruiz');
    });

    test('fracaso: rechaza registro con correo ya existente', async () => {
      mockUsersService.findByEmail = async (email: string) => {
        const existing = new User();
        existing.id = 'existing-id';
        existing.email = email;
        return existing;
      };

      await assert.rejects(
        async () => {
          await authService.register({
            name: 'Carlos Ruiz',
            email: 'carlos@ejemplo.com',
            password: 'Password123!',
          });
        },
        (err: any) => err instanceof ConflictException,
      );
    });
  });

  describe('Login', () => {
    test('éxito: credenciales correctas devuelven usuario y token', async () => {
      const plainPassword = 'Password123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      const existingUser = new User();
      existingUser.id = 'user-login-id';
      existingUser.name = 'Lucia Gomez';
      existingUser.email = 'lucia@ejemplo.com';
      existingUser.passwordHash = hash;
      existingUser.tokenVersion = 0;

      mockUsersService.findByEmail = async () => existingUser;

      const res = await authService.login(
        { email: 'lucia@ejemplo.com', password: plainPassword },
        '127.0.0.1',
      );

      assert.ok(res.token);
      assert.equal(res.user.email, 'lucia@ejemplo.com');
    });

    test('fracaso: rechaza login con contraseña incorrecta', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('PasswordCorrecta1!', salt);

      const existingUser = new User();
      existingUser.id = 'user-login-id';
      existingUser.email = 'lucia@ejemplo.com';
      existingUser.passwordHash = hash;
      existingUser.tokenVersion = 0;

      mockUsersService.findByEmail = async () => existingUser;

      await assert.rejects(
        async () => {
          await authService.login(
            { email: 'lucia@ejemplo.com', password: 'PasswordIncorrecta9!' },
            '127.0.0.1',
          );
        },
        (err: any) => err instanceof UnauthorizedException,
      );
    });
  });

  describe('Cancelación y eliminación de cuenta', () => {
    test('éxito: elimina la cuenta cuando la contraseña coincide', async () => {
      const plainPassword = 'PasswordEliminar1!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      const user = new User();
      user.id = 'user-to-delete';
      user.email = 'borrar@ejemplo.com';
      user.passwordHash = hash;

      let deletedId: string | null = null;
      mockUsersService.remove = async (id: string) => {
        deletedId = id;
      };


      const res = await authService.deleteAccount(
        user,
        { password: plainPassword },
        '127.0.0.1',
      );

      assert.deepEqual(res, { ok: true });
      assert.equal(deletedId, 'user-to-delete');
    });

    test('fracaso: rechaza eliminación si la contraseña no coincide', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('PasswordReal1!', salt);

      const user = new User();
      user.id = 'user-to-delete';
      user.email = 'borrar@ejemplo.com';
      user.passwordHash = hash;

      await assert.rejects(
        async () => {
          await authService.deleteAccount(
            user,
            { password: 'PasswordEquivocada1!' },
            '127.0.0.1',
          );
        },
        (err: any) => err instanceof UnauthorizedException,
      );
    });
  });

  describe('Recuperación y confirmación de reset', () => {
    test('éxito: solicitud de recuperación genera código y envía correo', async () => {
      const user = new User();
      user.id = 'user-recover';
      user.email = 'recuperar@ejemplo.com';
      user.name = 'Juan';

      mockUsersService.findByEmail = async () => user;

      let sentEmail: string | null = null;
      mockMailService.sendPasswordResetCode = async (to: string) => {
        sentEmail = to;
      };


      const res = await authService.requestRecover({ email: 'recuperar@ejemplo.com' });
      assert.deepEqual(res, { ok: true });
      assert.equal(sentEmail, 'recuperar@ejemplo.com');
    });

    test('fracaso: confirmar reset con código incorrecto', async () => {
      const user = new User();
      user.id = 'user-reset';
      user.email = 'recuperar@ejemplo.com';
      user.resetCodeHash = await bcrypt.hash('123456', 10);
      user.resetCodeExpires = new Date(Date.now() + 100000);
      user.resetAttempts = 0;

      mockUsersService.findByEmail = async () => user;

      await assert.rejects(
        async () => {
          await authService.confirmReset({
            email: 'recuperar@ejemplo.com',
            code: '999999',
            newPassword: 'NuevaPassword1!',
          });
        },
        (err: any) => err instanceof UnauthorizedException,
      );
    });
  });
});
