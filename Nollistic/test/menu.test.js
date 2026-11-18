import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createMenuServer } from '../server.js'

const sample = { name: 'Vetkoek', category: 'Main', priceCents: 4900, description: 'Served warm.' }

async function launch(directory) {
  const server = await createMenuServer({ dataDirectory: directory })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const url = 'http://127.0.0.1:' + server.address().port
  return {
    request(path, method = 'GET', data) {
      const options = { method }
      if (data !== undefined) {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify(data)
      }
      return fetch(url + path, options)
    },
    stop() {
      return new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
    }
  }
}

test('menu CRUD, rejection, concurrent creates and persistence across restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'table-thyme-'))
  let app
  try {
    app = await launch(directory)
    const frontPage = await app.request('/')
    assert.equal(frontPage.status, 200)
    assert.match(await frontPage.text(), /Menu manager/)
    const initial = await app.request('/api/dishes')
    assert.equal((await initial.json()).length, 3)

    const invalid = await app.request('/api/dishes', 'POST', { ...sample, priceCents: -1 })
    assert.equal(invalid.status, 400)

    const responses = await Promise.all([
      app.request('/api/dishes', 'POST', sample),
      app.request('/api/dishes', 'POST', { ...sample, name: 'Bunny Chow' })
    ])
    assert.deepEqual(responses.map(response => response.status), [201, 201])
    const [dish, second] = await Promise.all(responses.map(response => response.json()))
    assert.notEqual(dish.id, second.id)
    const location = responses[0].headers.get('location')

    const update = await app.request(location, 'PUT', { ...sample, name: 'Curried Vetkoek', priceCents: 5200 })
    assert.equal(update.status, 200)
    assert.equal((await update.json()).id, dish.id)
    const missing = await app.request('/api/dishes/00000000-0000-0000-0000-000000000000', 'DELETE')
    assert.equal(missing.status, 404)

    await app.stop()
    app = await launch(directory)
    const restored = await app.request('/api/dishes')
    const dishes = await restored.json()
    assert.equal(dishes.length, 5)
    assert.equal(dishes.find(item => item.id === dish.id).name, 'Curried Vetkoek')
    assert.equal(dishes.find(item => item.id === second.id).name, 'Bunny Chow')

    const remove = await app.request(location, 'DELETE')
    assert.equal(remove.status, 204)
    assert.equal(await remove.text(), '')
    assert.equal((await app.request(location)).status, 404)

    await app.stop()
    app = await launch(directory)
    const afterRemove = await app.request('/api/dishes')
    assert.equal((await afterRemove.json()).length, 4)
  } finally {
    if (app) await app.stop()
    await rm(directory, { recursive: true, force: true })
  }
})
