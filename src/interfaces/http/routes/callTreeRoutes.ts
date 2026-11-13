import type { FastifyPluginAsync } from 'fastify'
import type { CallTreeController } from '../../controllers/CallTreeController.js'

const uuidParams = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: { id: { type: 'string', format: 'uuid' } },
} as const
const documentSchema = {
  type: 'object',
  required: ['version', 'entry', 'nodes'],
  additionalProperties: false,
  properties: {
    version: { type: 'string', const: '1' },
    entry: { type: 'string', minLength: 1 },
    nodes: {
      type: 'object',
      minProperties: 1,
      additionalProperties: true,
    },
  },
} as const
const responseSchema = {
  type: 'object',
  required: ['id', 'tenantId', 'name', 'document', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenantId: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    document: documentSchema,
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

export const callTreeRoutes: FastifyPluginAsync<{
  controller: CallTreeController
}> = async (app, { controller }) => {
  app.post(
    '/tenants',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 160 },
          },
        },
      },
    },
    controller.createTenantRoute,
  )
  app.post(
    '/call-trees',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['tenantId', 'name', 'document'],
          additionalProperties: false,
          properties: {
            tenantId: { type: 'string', format: 'uuid' },
            name: { type: 'string', minLength: 1, maxLength: 120 },
            document: documentSchema,
          },
        },
        response: { 201: responseSchema },
      },
    },
    controller.createTree,
  )
  app.get(
    '/call-trees/:id',
    { schema: { params: uuidParams, response: { 200: responseSchema } } },
    controller.getTree,
  )
  app.get(
    '/call-trees',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['tenantId'],
          additionalProperties: false,
          properties: { tenantId: { type: 'string', format: 'uuid' } },
        },
        response: { 200: { type: 'array', items: responseSchema } },
      },
    },
    controller.listTrees,
  )
}
