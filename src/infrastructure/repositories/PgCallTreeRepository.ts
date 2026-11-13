import type { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { ApplicationError } from '../../domain/errors/ApplicationError.js'
import {
  CallTree,
  type CallTreeDocument,
} from '../../domain/entities/CallTree.js'
import type {
  CallTreeRepository,
  NewCallTree,
} from '../../domain/repositories/ICallTreeRepository.js'

type Row = {
  id: string
  tenant_id: string
  name: string
  document: CallTreeDocument
  created_at: Date
}
const toEntity = (row: Row) =>
  new CallTree(row.id, row.tenant_id, row.name, row.document, row.created_at)

export class PgCallTreeRepository implements CallTreeRepository {
  constructor(private readonly db: Pool) {}
  async save(tree: NewCallTree): Promise<CallTree> {
    try {
      const { rows } = await this.db.query<Row>(
        `INSERT INTO call_trees (id, tenant_id, name, document) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, name, document, created_at`,
        [randomUUID(), tree.tenantId, tree.name.trim(), tree.document],
      )
      return toEntity(rows[0])
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23503'
      ) {
        throw new ApplicationError('Tenant was not found', 'NOT_FOUND')
      }
      throw error
    }
  }
  async getById(id: string): Promise<CallTree> {
    const { rows } = await this.db.query<Row>(
      'SELECT id, tenant_id, name, document, created_at FROM call_trees WHERE id = $1',
      [id],
    )
    if (!rows[0])
      throw new ApplicationError(`Call tree ${id} was not found`, 'NOT_FOUND')
    return toEntity(rows[0])
  }
  async listByTenant(tenantId: string): Promise<CallTree[]> {
    const { rows } = await this.db.query<Row>(
      'SELECT id, tenant_id, name, document, created_at FROM call_trees WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId],
    )
    return rows.map(toEntity)
  }
}
