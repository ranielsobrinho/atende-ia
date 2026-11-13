import { pool } from '../../../../infrastructure/database/pool.js'
import { PgCallTreeRepository } from '../../../../infrastructure/repositories/PgCallTreeRepository.js'
import {
  CreateCallTree,
  GetCallTree,
  ListCallTrees,
} from '../../../../usecases/call-tree/CallTreeUseCases.js'
import { CallTreeController } from '../../../controllers/CallTreeController.js'
import { PgTenantRepository } from '../../../../infrastructure/repositories/PgTenantRepository.js'
import { CreateTenant } from '../../../../usecases/call-tree/CreateTenant.js'

export function makeCallTreeController() {
  const repository = new PgCallTreeRepository(pool)
  return new CallTreeController(
    new CreateCallTree(repository),
    new GetCallTree(repository),
    new ListCallTrees(repository),
    new CreateTenant(new PgTenantRepository(pool)),
  )
}
