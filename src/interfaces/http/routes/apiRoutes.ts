import type { FastifyPluginAsync } from 'fastify'
import type { CallTreeController } from '../../controllers/CallTreeController.js'
import { callTreeRoutes } from './callTreeRoutes.js'

export const API_PREFIX = '/api/v1'
export type ApiRoutesOptions = { callTreeController: CallTreeController }
export const apiRoutes: FastifyPluginAsync<ApiRoutesOptions> = async (
  app,
  deps,
) => {
  app.register(callTreeRoutes, { controller: deps.callTreeController })
}
