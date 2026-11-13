import type { FastifyInstance } from 'fastify'
import { CallTreeController } from '../../src/interfaces/controllers/CallTreeController.js'
import {
  CreateCallTree,
  GetCallTree,
  ListCallTrees,
} from '../../src/usecases/call-tree/CallTreeUseCases.js'
import {
  buildServer,
  type ServerConfig,
} from '../../src/interfaces/http/server.js'
import type { CallTreeRepository } from '../../src/domain/repositories/ICallTreeRepository.js'
import { CreateTenant } from '../../src/usecases/call-tree/CreateTenant.js'
import type { TenantRepository } from '../../src/domain/repositories/ITenantRepository.js'

export async function buildTestApp(
  repository: CallTreeRepository & TenantRepository,
  config: ServerConfig = {},
): Promise<FastifyInstance> {
  const controller: CallTreeController = new CallTreeController(
    new CreateCallTree(repository),
    new GetCallTree(repository),
    new ListCallTrees(repository),
    new CreateTenant(repository),
  )
  return buildServer(
    { callTreeController: controller },
    { logger: false, ...config },
  )
}
