import type { FastifyInstance } from 'fastify'

const SWAGGER_OPTIONS = {
  openapi: '3.0.3',
  info: {
    title: 'Atende-IA API',
    version: '0.1.0',
    description: 'API MVP for tenants and versioned clinic call trees.',
  },
  servers: [{ url: 'http://localhost:5000' }],
  tags: [{ name: 'call-trees' }, { name: 'health' }],
}

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  const { default: swagger } = await import('@fastify/swagger')
  const { default: swaggerUI } = await import('@fastify/swagger-ui')
  await app.register(swagger, SWAGGER_OPTIONS as any)
  await app.register(swaggerUI, { routePrefix: '/swagger', staticCSP: true })
}

export { SWAGGER_OPTIONS }
