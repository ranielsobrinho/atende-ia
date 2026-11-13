import { pool } from '../../../infrastructure/database/pool.js'
import { PgCallTreeRepository } from '../../../infrastructure/repositories/PgCallTreeRepository.js'
import type { CallTreeRepository } from '../../../domain/repositories/ICallTreeRepository.js'
import { GetCallTree } from '../../../usecases/call-tree/CallTreeUseCases.js'
import { GetCallTreeHandler } from '../controllers/GetCallTreeHandler.js'
export function makeCallTreeHandlers(
  repository: CallTreeRepository = new PgCallTreeRepository(pool),
) {
  return {
    getCallTreeHandler: new GetCallTreeHandler(new GetCallTree(repository)),
  }
}
