import { ApplicationError } from '../../domain/errors/ApplicationError.js'
import type { CallTreeDocument } from '../../domain/entities/CallTree.js'
import type {
  CallTreeRepository,
  NewCallTree,
} from '../../domain/repositories/ICallTreeRepository.js'

export class CreateCallTree {
  constructor(private readonly repository: CallTreeRepository) {}
  execute(input: NewCallTree) {
    if (!input.tenantId || !input.name.trim() || input.name.length > 120)
      throw new ApplicationError(
        'tenantId and a name of up to 120 characters are required',
        'VALIDATION_ERROR',
      )
    validateDocument(input.document)
    return this.repository.save(input)
  }
}

export class GetCallTree {
  constructor(private readonly repository: CallTreeRepository) {}
  execute(id: string) {
    return this.repository.getById(id)
  }
}

export class ListCallTrees {
  constructor(private readonly repository: CallTreeRepository) {}
  execute(tenantId: string) {
    if (!tenantId)
      throw new ApplicationError('tenantId is required', 'VALIDATION_ERROR')
    return this.repository.listByTenant(tenantId)
  }
}

function validateDocument(document: CallTreeDocument): void {
  if (
    !document ||
    document.version !== '1' ||
    !document.entry ||
    !document.nodes ||
    typeof document.nodes !== 'object' ||
    Array.isArray(document.nodes)
  ) {
    throw new ApplicationError(
      'document must include version "1", entry and nodes object',
      'VALIDATION_ERROR',
    )
  }
  if (!Object.hasOwn(document.nodes, document.entry))
    throw new ApplicationError(
      'entry must reference an existing node',
      'VALIDATION_ERROR',
    )
}
