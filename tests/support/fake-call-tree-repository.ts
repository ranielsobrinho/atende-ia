import { randomUUID } from 'node:crypto'
import { ApplicationError } from '../../src/domain/errors/ApplicationError.js'
import {
  CallTree,
  type CallTreeDocument,
} from '../../src/domain/entities/CallTree.js'
import type {
  CallTreeRepository,
  NewCallTree,
} from '../../src/domain/repositories/ICallTreeRepository.js'
import { Tenant } from '../../src/domain/entities/Tenant.js'
import type { TenantRepository } from '../../src/domain/repositories/ITenantRepository.js'

export class FakeCallTreeRepository
  implements CallTreeRepository, TenantRepository
{
  private readonly trees = new Map<string, CallTree>()
  async create(name: string) {
    return new Tenant(randomUUID(), name, new Date())
  }
  async save(input: NewCallTree) {
    const tree = new CallTree(
      randomUUID(),
      input.tenantId,
      input.name,
      input.document,
      new Date(),
    )
    this.trees.set(tree.id, tree)
    return tree
  }
  async getById(id: string) {
    const tree = this.trees.get(id)
    if (!tree)
      throw new ApplicationError(`Call tree ${id} was not found`, 'NOT_FOUND')
    return tree
  }
  async listByTenant(tenantId: string) {
    return [...this.trees.values()].filter((tree) => tree.tenantId === tenantId)
  }
}
