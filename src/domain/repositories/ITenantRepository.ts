import type { Tenant } from '../entities/Tenant.js'
export interface TenantRepository {
  create(name: string): Promise<Tenant>
}
