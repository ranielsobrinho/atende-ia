import type { GetCallTree } from '../../../usecases/call-tree/CallTreeUseCases.js'
import { CallTreePresenter } from '../../presenters/CallTreePresenter.js'
import { toGrpcError } from '../errors/grpcErrorMapper.js'
import type { CallTreeServiceServer } from '../generated/proto/call_tree.js'

export class GetCallTreeHandler {
  constructor(private readonly getCallTree: GetCallTree) {}
  handle: CallTreeServiceServer['getCallTree'] = async (call, callback) => {
    try {
      const tree = await this.getCallTree.execute(call.request.id)
      const result = CallTreePresenter.toJSON(tree)
      callback(null, {
        ...result,
        documentJson: JSON.stringify(result.document),
      })
    } catch (error) {
      callback(toGrpcError(error))
    }
  }
}
