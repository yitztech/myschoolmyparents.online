import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    const user = this.repo.create({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      provider: 'local',
    });
    return this.repo.save(user);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  /**
   * Escribe solo las columnas indicadas. A diferencia de `save`, no pisa
   * con valores leídos antes las columnas que otra petición haya cambiado
   * entretanto (p. ej. `reset_attempts`).
   */
  async update(id: string, changes: QueryDeepPartialEntity<User>): Promise<void> {
    await this.repo.update({ id }, changes);
  }

  /**
   * Reserva un intento de código de recuperación de forma atómica: suma uno
   * a `reset_attempts` solo si hay un código vigente y queda cupo. Devuelve
   * false si no lo hay.
   *
   * Tiene que ser un único UPDATE condicional: leer el contador, comparar y
   * guardar después dejaba que muchas peticiones simultáneas leyeran todas
   * el mismo valor y se saltaran el tope.
   */
  async reserveResetAttempt(id: string, maxAttempts: number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(User)
      .set({ resetAttempts: () => 'reset_attempts + 1' })
      .where('id = :id', { id })
      .andWhere('reset_attempts < :max', { max: maxAttempts })
      .andWhere('reset_code_hash IS NOT NULL')
      .andWhere('reset_code_expires > NOW()')
      .execute();
    return (result.affected ?? 0) > 0;
  }
}
