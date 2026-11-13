import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import { Tenant } from '../../domain/entities/Tenant.js'
import type { TenantRepository } from '../../domain/repositories/ITenantRepository.js'
export class PgTenantRepository implements TenantRepository {
  constructor(private readonly db: Pool) {}
  async create(name: string) {
    const { rows } = await this.db.query<{
      id: string
      name: string
      created_at: Date
    }>(
      'INSERT INTO tenants (id, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [randomUUID(), name],
    )
    return new Tenant(rows[0].id, rows[0].name, rows[0].created_at)
  }
}
