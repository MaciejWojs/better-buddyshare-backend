import { Hono } from 'hono'
import { serve } from 'bun'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import { UserRepository } from './repositories/user.repository'
import { UserDAO } from './dao/Users'
import { UserCacheDao } from './dao/UsersCache'
import { CacheService } from './services/cache.service'
import { MediaWorkerService } from './services/media-worker.service'

const app = new Hono()

const openApiDoc = {
  openapi: "3.0.0", // This is the required version field
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "API documentation for your service",
  },
  paths: {
    // Add your API paths here
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },
    },
    // Add more endpoints as needed
  },
};

// Inicjalizacja serwisów - Redis będzie automatycznie połączony przez CacheService
CacheService.getInstance();
MediaWorkerService.getInstance();

const userDAO = UserDAO.getInstance();
const userCache = UserCacheDao.getInstance();
const userRepository = new UserRepository(userDAO, userCache);

app.use('*', cors())

app.use('*', (c, next) => {
  console.log(`Request received: ${c.req.method} ${c.req.url}`)
  return next()
})


// Serve the OpenAPI document
app.get("/doc", (c) => c.json(openApiDoc));

// Use the middleware to serve Swagger UI at /ui
app.get('/ui', swaggerUI({ url: '/doc' }))

app.get("/health", (c) => c.text("OK"));


app.get('/', (c) => {
  return c.text('Hello Hono!\r\n')
})

const indexHtml = () => {
  return `
  <h1>Welcome to Hono!</h1>
  <p>This is a simple Hono application running on Bun.</p>
  <p>Enjoy building your web applications!</p>
`
}

app.get('/app', (c) => {
  return c.html(indexHtml())
})

app.get('/backend', (c) => {
  const num = Bun.env.NUMBER || "1";
  console.log(`Request received on backend instance: ${num}`);
  return c.json({
    message: `[${num}] Hello from the backend with load balancing!`,
  })
})

async function startServer(port: number) {
  while (true) {
    try {
      const server = serve({ fetch: app.fetch, port })
      console.log(`Serwer uruchomiony na porcie ${port}`)
      return server
    } catch (e: any) {
      if (e?.code === 'EADDRINUSE') {
        console.log(`Port ${port} zajęty, próbuję ${port + 1}`)
        port++
      } else {
        throw e
      }
    }
  }
}


app.get('/user/:id', async (c) => {
  const id = c.req.param('id')
  console.log(`Fetching user with ID: ${id}`)
  // Tu możesz dodać logikę pobierania użytkownika z bazy danych

  return c.json(await userRepository.getUserById(Number(id)))
})

app.post('/start', async (c) => {
  const body = await c.req.json()
  console.log('[STREAM START]', body)

  // Tu np. walidacja tokenu, streamu, itp.
  // Jeśli nieautoryzowany:
  // return c.text('Forbidden', 403)

  return c.json({ code: 0 }, 200)
})

app.post('stop', async (c) => {
  console.log('Stream ended')
  return c.json({ code: 0 }, 200)
})

app.get('/forward', async (c) => {
  console.log('Forwarding request')
  console.log(c.req.raw)
  return c.text('Forwarded request', 200)
})


app.get('/token', async (c) => {
  const stream_id = c.req.query('stream_id')
  const token = c.req.query('token')

  console.log(`HEADERS:`, c.req.raw.headers)
  console.log(`Query parameters: ${c.req.queries()}`)


  console.log(`Received stream_id: ${stream_id}, token: ${token}`)
  console.log('X-Stream-ID header:', c.req.header('X-Stream-ID'))
  console.log('User-Agent:', c.req.header('User-Agent'))

  const id = "123"

  // Spróbuj oba warianty nagłówka
  c.res.headers.set('Token', id) // Wielkie litery
  c.res.headers.set('token', id) // Małe litery

  console.log(`Sending token: ${id}`)

  // Tu możesz dodać logikę sprawdzania tokenu, np. czy jest ważny, czy istnieje w bazie danych itp.
  return c.json({ token: id }, 200)
}
)

app.post('/dvr', async (c) => {
  const body = await c.req.json()
  console.log('[DVR EVENT]', body)

  const ip = body.ip
  const token = body.stream
  const filePath = body.file

  console.log(`Received stream_token: ${token}`)
  console.log(`Received file path: ${filePath}`)

  if (!token) {
    console.log('No stream_token provided')
    return c.json({ code: 1, message: 'No stream_token provided' }, 400)
  }

  // Wyodrębnienie nazwy pliku z pełnej ścieżki
  const filename = filePath ? filePath.split('/').pop() || `${token}.mp4` : `${token}.mp4`

  console.log(`Extracted filename: ${filename}`)

  //! IMPORTANT: ZAMIANA TOKENU NA ID STRUMIENIA I PUBLIKACJA DO RABBITMQ

  const mediaService = MediaWorkerService.getInstance();


  //! zamienic token na id strumienia
  const response = await mediaService.publishVideoProcessingRequest(1, filename, ip);

  console.log('Published video processing request to media worker:', response);

  // Tu możesz dodać logikę obsługi zdarzenia DVR, np. zapisywanie informacji do bazy danych

  return c.json({ code: 0 }, 200)
})

startServer(5000)