// deleter.ts
import { Hono } from 'hono';
import { serve } from 'bun';
import { promises as fs } from 'fs';

if (
  !process.env.SRS_DELETER_HOST ||
  !process.env.DELETER_PORT ||
  !process.env.DELETER_API_TOKEN
) {
  console.error(
    'SRS deleter configuration is not fully defined in environment variables',
  );
  process.exit(1);
}

const app = new Hono();

const API_TOKEN = process.env.DELETER_API_TOKEN || 'secret123';

app.use('*', async (c, next) => {
  const token = c.req.header('authorization') || '';
  if (!token.includes(API_TOKEN)) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

app.delete('/delete', async (c) => {
  const relPath = c.req.query('path');
  if (!relPath) return c.json({ ok: false, error: 'missing path' }, 400);

  const resolved = `/usr/local/srs/objs/nginx/html/${relPath}`;
  try {
    await fs.rm(resolved, { force: true });
    return c.json({ ok: true, deleted: resolved });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

app.get('/', (c) => c.text('deleter running'));

serve({
  fetch: app.fetch,
  port: Number(process.env.DELETER_PORT || 3000),
});
