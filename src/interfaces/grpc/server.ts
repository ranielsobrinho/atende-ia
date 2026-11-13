import { Server } from '@grpc/grpc-js'
import { CallTreeServiceService } from './generated/proto/call_tree.js'
import type { GetCallTreeHandler } from './controllers/GetCallTreeHandler.js'

export function buildGrpcServer(deps: {
  getCallTreeHandler: GetCallTreeHandler
}): Server {
  const server = new Server()
  server.addService(CallTreeServiceService, {
    getCallTree: deps.getCallTreeHandler.handle,
  })
  return server
}

export async function bindGrpcServer(
  server: Server,
  port: number,
  credentials: any,
): Promise<number> {
  return new Promise((resolve, reject) =>
    server.bindAsync(`0.0.0.0:${port}`, credentials, (err, boundPort) =>
      err ? reject(err) : resolve(boundPort),
    ),
  )
}
