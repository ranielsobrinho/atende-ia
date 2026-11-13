import type { FastifyReply, FastifyRequest } from 'fastify'
import type {
  CreateCallTree,
  GetCallTree,
  ListCallTrees,
} from '../../usecases/call-tree/CallTreeUseCases.js'
import { CallTreePresenter } from '../presenters/CallTreePresenter.js'
import type { CreateTenant } from '../../usecases/call-tree/CreateTenant.js'

type CreateBody = {
  tenantId: string
  name: string
  document: { version: string; entry: string; nodes: Record<string, unknown> }
}
type IdParams = { id: string }
type TenantQuery = { tenantId: string }
type TenantBody = { name: string }
export class CallTreeController {
  constructor(
    private readonly create: CreateCallTree,
    private readonly get: GetCallTree,
    private readonly list: ListCallTrees,
    private readonly createTenant: CreateTenant,
  ) {}
  createTenantRoute = async (
    request: FastifyRequest<{ Body: TenantBody }>,
    reply: FastifyReply,
  ) => reply.code(201).send(await this.createTenant.execute(request.body.name))
  createTree = async (
    request: FastifyRequest<{ Body: CreateBody }>,
    reply: FastifyReply,
  ) =>
    reply
      .code(201)
      .send(CallTreePresenter.toJSON(await this.create.execute(request.body)))
  getTree = async (
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply,
  ) =>
    reply.send(
      CallTreePresenter.toJSON(await this.get.execute(request.params.id)),
    )
  listTrees = async (
    request: FastifyRequest<{ Querystring: TenantQuery }>,
    reply: FastifyReply,
  ) =>
    reply.send(
      (await this.list.execute(request.query.tenantId)).map(
        CallTreePresenter.toJSON,
      ),
    )
}
