import { describe, expect, it } from 'vitest'
import { buildTestApp } from '../support/build-test-app.js'
import { FakeCallTreeRepository } from '../support/fake-call-tree-repository.js'

const document = {
  version: '1',
  entry: 'welcome',
  nodes: { welcome: { speech: 'Olá', edges: [] } },
}

describe('call tree routes', () => {
  it('creates, gets and lists a tree for a tenant', async () => {
    const app = await buildTestApp(new FakeCallTreeRepository())
    const tenant = await app.inject({
      method: 'POST',
      url: '/api/v1/tenants',
      payload: { name: 'Clínica Odonto' },
    })
    expect(tenant.statusCode).toBe(201)
    const tenantId = tenant.json().id as string
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/call-trees',
      payload: { tenantId: tenant.json().id, name: 'Odonto', document },
    })
    expect(created.statusCode).toBe(201)
    expect(created.json().document).toEqual(document)
    const { id } = created.json()
    expect(
      (await app.inject({ method: 'GET', url: `/api/v1/call-trees/${id}` }))
        .statusCode,
    ).toBe(200)
    const listed = await app.inject({
      method: 'GET',
      url: `/api/v1/call-trees?tenantId=${tenantId}`,
    })
    expect(listed.statusCode).toBe(200)
    expect(listed.json()).toHaveLength(1)
    await app.close()
  })

  it('validates tenant names', async () => {
    const app = await buildTestApp(new FakeCallTreeRepository())
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tenants',
      payload: { name: '  ' },
    })
    expect(response.statusCode).toBe(400)
    await app.close()
  })

  it('rejects a document whose entry does not exist', async () => {
    const app = await buildTestApp(new FakeCallTreeRepository())
    const tenant = await app.inject({
      method: 'POST',
      url: '/api/v1/tenants',
      payload: { name: 'Clínica Odonto' },
    })
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/call-trees',
      payload: {
        tenantId: tenant.json().id,
        name: 'Odonto',
        document: { ...document, entry: 'missing' },
      },
    })
    expect(response.statusCode).toBe(400)
    await app.close()
  })
})
