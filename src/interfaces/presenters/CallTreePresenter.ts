import type { CallTree } from '../../domain/entities/CallTree.js'

export const CallTreePresenter = {
  toJSON(tree: CallTree) {
    return {
      id: tree.id,
      tenantId: tree.tenantId,
      name: tree.name,
      document: tree.document,
      createdAt: tree.createdAt.toISOString(),
    }
  },
}
