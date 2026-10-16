import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HealthController } from '../src/health/health.controller';

describe('HealthController - Casos de Éxito y Fracaso', () => {
  test('éxito: retorna db up cuando la base de datos responde', async () => {
    const mockDataSource: any = {
      query: async (sql: string) => [{ '?column?': 1 }],
    };
    const controller = new HealthController(mockDataSource);
    const result = await controller.check();

    assert.equal(result.ok, true);
    assert.equal(result.db, 'up');
    assert.equal(typeof result.uptime, 'number');
    assert.equal(result.version, '1.0.0');
  });

  test('fracaso: reporta db down si la base de datos falla', async () => {
    const mockDataSource: any = {
      query: async () => {
        throw new Error('Connection refused');
      },
    };
    const controller = new HealthController(mockDataSource);
    const result = await controller.check();

    assert.equal(result.ok, true);
    assert.equal(result.db, 'down');
  });
});
