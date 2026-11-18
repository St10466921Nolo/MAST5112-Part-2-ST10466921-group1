

const categories = ['Starter', 'Main', 'Dessert', 'Drink']
const assets = new Map([
  ['/', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']]
])
const collectionPath = '/api/dishes'
const dishPath = /^\/api\/dishes\/([0-9a-f-]{36})$/

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  response.end(JSON.stringify(data))
}

function rejectMethod(response, allow) {
  response.setHeader('Allow', allow)
  throw new HttpError(405, 'This method is unavailable for that URL.')
}

async function readDish(request) {
  const contentType = request.headers['content-type']?.split(';')[0].trim().toLowerCase()
  if (contentType !== 'application/json') {
    throw new HttpError(415, 'Send the dish as application/json.')
  }

  const chunks = []
  let size = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > 8192) {
      request.resume()
      throw new HttpError(413, 'The request body is too large.')
    }
    chunks.push(chunk)
  }

  let input
  try {
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'The request body must contain valid JSON.')
  }

  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const { category, priceCents, description } = input ?? {}
  if (!name || name.length > 80) {
    throw new HttpError(400, 'Enter a dish name of 1 to 80 characters.')
  }
  if (!categories.includes(category)) {
    throw new HttpError(400, 'Select a valid category.')
  }
  if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 999999) {
    throw new HttpError(400, 'Enter a price from R0.00 to R9,999.99.')
  }
  if (typeof description !== 'string' || description.trim().length > 240) {
    throw new HttpError(400, 'Enter a description of up to 240 characters.')
  }

  return { name, category, priceCents, description: description.trim() }
}

export async function createMenuServer({ dataDirectory } = {}) {
  const directory = dataDirectory ?? fileURLToPath(new URL('./data/', import.meta.url))
  const menu = await openMenuStore(directory)

  return createServer(async (request, response) => {
    const { method } = request
    const path = request.url.split('?')[0]
    const item = dishPath.exec(path)

    try {
      if (path === collectionPath) {
        if (method === 'GET') return sendJson(response, 200, menu.list())
        if (method !== 'POST') rejectMethod(response, 'GET, POST')

        const dish = { id: randomUUID(), ...await readDish(request) }
        await menu.change(dishes => [dish, ...dishes])
        response.setHeader('Location', collectionPath + '/' + dish.id)
        return sendJson(response, 201, dish)
      }

      if (item) {
        const id = item[1]
        if (method === 'GET') {
          const dish = menu.list().find(dish => dish.id === id)
          if (!dish) throw new HttpError(404, 'That dish could not be found.')
          return sendJson(response, 200, dish)
        }
        if (method !== 'PUT' && method !== 'DELETE') {
          rejectMethod(response, 'GET, PUT, DELETE')
        }

        const replacement = method === 'PUT' ? { id, ...await readDish(request) } : null
        await menu.change(dishes => {
          if (!dishes.some(dish => dish.id === id)) {
            throw new HttpError(404, 'That dish could not be found.')
          }
          if (replacement) {
            return dishes.map(dish => dish.id === id ? replacement : dish)
          }
          return dishes.filter(dish => dish.id !== id)
        })
        if (replacement) return sendJson(response, 200, replacement)
        response.writeHead(204, { 'Cache-Control': 'no-store' })
        return response.end()
      }

      const asset = assets.get(path)
      if (!asset) throw new HttpError(404, 'That page could not be found.')
      if (method !== 'GET') rejectMethod(response, 'GET')

      const [filename, type] = asset
      const bytes = await readFile(new URL('./public/' + filename, import.meta.url))
      response.writeHead(200, { 'Content-Type': type + '; charset=utf-8' })
      response.end(bytes)
    } catch (error) {
      if (error instanceof HttpError) return sendJson(response, error.status, { error: error.message })
      console.error(error)
      sendJson(response, 500, { error: 'The server could not complete the request.' })
    }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }
  const server = await createMenuServer()
  server.listen(port, '127.0.0.1', () => {
    console.log('Table & Thyme is running at http://127.0.0.1:' + port)
  })
}
