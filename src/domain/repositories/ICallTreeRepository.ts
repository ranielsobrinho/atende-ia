import type { CallTree, CallTreeDocument } from '../entities/CallTree.js'

export type NewCallTree = {
  tenantId: string
  name: string
  document: CallTreeDocument
}
export interface CallTreeRepository {
  save(tree: NewCallTree): Promise<CallTree>
  getById(id: string): Promise<CallTree>
  listByTenant(tenantId: string): Promise<CallTree[]>
}
