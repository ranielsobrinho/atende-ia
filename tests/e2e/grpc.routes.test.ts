import {
  credentials,
  ServerCredentials,
  status,
  type Server,
  type ServiceError,
} from '@grpc/grpc-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { makeCallTreeHandlers } from '../../src/interfaces/grpc/factories/makeCallTreeHandlers.js'
import {
  CallTreeServiceClient,
  type CallTree as GrpcCallTree,
} from '../../src/interfaces/grpc/generated/proto/call_tree.js'
import { buildGrpcServer } from '../../src/interfaces/grpc/server.js'
import { FakeCallTreeRepository } from '../support/fake-call-tree-repository.js'

const unary = <T>(
  call: (callback: (error: ServiceError | null, response?: T) => void) => void,
) =>
  new Promise<T>((resolve, reject) =>
    call((error, response) => (error ? reject(error) : resolve(response as T))),
  )
describe('gRPC call tree service', () => {
  let server: Server
  let client: CallTreeServiceClient
  let treeId: string
  beforeAll(async () => {
    const repository = new FakeCallTreeRepository()
    const created = await repository.save({
      tenantId: '23cf2272-5f0c-48b4-a23d-697a14fe117b',
      name: 'Odonto',
      document: {
        version: '1',
        entry: 'welcome',
        nodes: { welcome: { speech: 'Olá' } },
      },
    })
    treeId = created.id
    server = buildGrpcServer(makeCallTreeHandlers(repository))
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        '127.0.0.1:0',
        ServerCredentials.createInsecure(),
        (error, boundPort) => (error ? reject(error) : resolve(boundPort)),
      ),
    )
    client = new CallTreeServiceClient(
      `127.0.0.1:${port}`,
      credentials.createInsecure(),
    )
  })
  afterAll(() => {
    client.close()
    server.forceShutdown()
  })
  it('returns the tree and maps missing ids to NOT_FOUND', async () => {
    const tree = await unary<GrpcCallTree>((cb) =>
      client.getCallTree({ id: treeId }, cb),
    )
    expect(tree).toMatchObject({ id: treeId, name: 'Odonto' })
    expect(JSON.parse(tree.documentJson)).toMatchObject({ entry: 'welcome' })
    await expect(
      unary((cb) =>
        client.getCallTree({ id: 'e25313ee-c6a1-4efc-9c13-ccf839f90d53' }, cb),
      ),
    ).rejects.toMatchObject({ code: status.NOT_FOUND })
  })
})
