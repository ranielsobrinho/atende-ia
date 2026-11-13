import type { ApiRoutesOptions } from '../../routes/apiRoutes.js'
import { makeCallTreeController } from './makeCallTreeController.js'
export function makeCallTreeControllers(): ApiRoutesOptions {
  return { callTreeController: makeCallTreeController() }
}
