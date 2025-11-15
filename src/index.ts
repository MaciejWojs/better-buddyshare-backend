import { Hono } from 'hono';
import { serve } from 'bun';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { UserRepository } from './repositories/user';
import { UserDAO } from './dao/Users';
import { UserCacheDao } from './dao/UsersCache';
import { CacheService } from './services/cache.service';
import { MediaWorkerService } from './services/media-worker.service';
import { PermissionDAO } from './dao/Permissions';

const app = new Hono();

const openApiDoc = {
  openapi: '3.0.0', // This is the required version field
  info: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'API documentation for your service',
  },
  paths: {
    // Add your API paths here
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    // Add more endpoints as needed
  },
};

// Services initialization - Redis will be automatically connected by CacheService
CacheService.getInstance();
MediaWorkerService.getInstance();

const userRepository = new UserRepository();

app.use('*', cors());

app.use('*', (c, next) => {
  console.log(`Request received: ${c.req.method} ${c.req.url}`);
  return next();
});

// Serve the OpenAPI document
app.get('/doc', (c) => c.json(openApiDoc));

// Use the middleware to serve Swagger UI at /ui
app.get('/ui', swaggerUI({ url: '/doc' }));

app.get('/health', (c) => c.text('OK'));

app.get('/', (c) => {
  return c.text('Hello Hono!\r\n');
});

const indexHtml = () => {
  return `
  <h1>Welcome to Hono!</h1>
  <p>This is a simple Hono application running on Bun.</p>
  <p>Enjoy building your web applications!</p>
`;
};

app.get('/app', (c) => {
  return c.html(indexHtml());
});

app.get('/backend', (c) => {
  const num = Bun.env.NUMBER || '1';
  console.log(`Request received on backend instance: ${num}`);
  return c.json({
    message: `[${num}] Hello from the backend with load balancing!`,
  });
});

async function startServer(port: number) {
  while (true) {
    try {
      const server = serve({ fetch: app.fetch, port });
      console.log(`Serwer uruchomiony na porcie ${port}`);
      return server;
    } catch (e: any) {
      if (e?.code === 'EADDRINUSE') {
        console.log(`Port ${port} zajęty, próbuję ${port + 1}`);
        port++;
      } else {
        throw e;
      }
    }
  }
}

app.get('/user/:id', async (c) => {
  const id = c.req.param('id');
  console.log(`Fetching user with ID: ${id}`);
  // Here you can add logic to fetch user from the database

  return c.json(await userRepository.getUserById(Number(id)));
});

app.post('/start', async (c) => {
  const body = await c.req.json();
  console.log('[STREAM START]', body);

  // Here e.g. token/stream validation, etc.
  // If unauthorized:
  // return c.text('Forbidden', 403)

  return c.json({ code: 0 }, 200);
});

app.post('stop', async (c) => {
  console.log('Stream ended');
  return c.json({ code: 0 }, 200);
});

app.get('/forward', async (c) => {
  console.log('Forwarding request');
  console.log(c.req.raw);
  return c.text('Forwarded request', 200);
});

app.get('/token', async (c) => {
  const stream_id = c.req.query('stream_id');
  const token = c.req.query('token');

  console.log(`HEADERS:`, c.req.raw.headers);
  console.log(`Query parameters: ${c.req.queries()}`);

  console.log(`Received stream_id: ${stream_id}, token: ${token}`);
  console.log('X-Stream-ID header:', c.req.header('X-Stream-ID'));
  console.log('User-Agent:', c.req.header('User-Agent'));

  const id = '123';

  // Try both header variants
  c.res.headers.set('Token', id); // Uppercase
  c.res.headers.set('token', id); // Lowercase

  console.log(`Sending token: ${id}`);

  // Here you can add logic to validate the token, e.g. check if it's valid or exists in DB.
  return c.json({ token: id }, 200);
});

app.post('/dvr', async (c) => {
  const body = await c.req.json();
  console.log('[DVR EVENT]', body);

  const ip = body.ip;
  const token = body.stream;
  const filePath = body.file;

  console.log(`Received stream_token: ${token}`);
  console.log(`Received file path: ${filePath}`);

  if (!token) {
    console.log('No stream_token provided');
    return c.json({ code: 1, message: 'No stream_token provided' }, 400);
  }

  // Extract filename from full path
  const filename = filePath
    ? filePath.split('/').pop() || `${token}.mp4`
    : `${token}.mp4`;

  console.log(`Extracted filename: ${filename}`);

  //! IMPORTANT: REPLACE TOKEN WITH STREAM ID AND PUBLISH TO RABBITMQ

  const mediaService = MediaWorkerService.getInstance();

  //! convert token to stream id
  const response = await mediaService.publishVideoProcessingRequest(
    1,
    filename,
    ip,
  );

  console.log('Published video processing request to media worker:', response);

  // Here you can add DVR event handling logic, e.g., saving info to the database

  return c.json({ code: 0 }, 200);
});

startServer(5000);

const perms = PermissionDAO.getInstance();

const x = async () => {
  const perm_name = 'TEST_PERMISSION';
  console.log(`Creating permission: ${perm_name}`);
  await perms.createPermission(perm_name);
  await perms.createPermission(perm_name + '_1');
  await perms.createPermission(perm_name + '_2');
  await perms.createPermission(perm_name + '_3');

  console.log(`Fetching permission by name: ${perm_name}`);
  await perms.getPermissionByName(perm_name);

  console.log(`Fetching permission by ID: 1`);
  await perms.getPermissionById(1);

  console.log(`Deleting permission by name: ${perm_name}`);
  await perms.deletePermissionByName(perm_name);

  console.log(`Fetching all permissions after deletion:`);
  await perms.getAllPermissions();

  const perm_name_2 = 'ANOTHER_PERMISSION';
  console.log(`Creating permission: ${perm_name_2}`);
  await perms.createPermission(perm_name_2);

  console.log(`Fetching all permissions:`);
  await perms.getAllPermissions();

  console.log(`Deleting permission by ID: 2`);
  await perms.deletePermissionById(2);

  console.log(`Fetching all permissions after deletion:`);
  await perms.getAllPermissions();
};

x();
