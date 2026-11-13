import type { TenantRepository } from '../../domain/repositories/ITenantRepository.js'
import { ApplicationError } from '../../domain/errors/ApplicationError.js'
export class CreateTenant {
  constructor(private readonly repository: TenantRepository) {}
  execute(name: string) {
    const normalized = name.trim()
    if (!normalized || normalized.length > 160)
      throw new ApplicationError(
        'name must contain between 1 and 160 characters',
        'VALIDATION_ERROR',
      )
    return this.repository.create(normalized)
  }
}
