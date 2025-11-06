import { Hono } from 'hono';
import { serve } from 'bun';
import { promises as fs } from 'fs';
import * as path from 'path';

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

const API_TOKEN = process.env.DELETER_API_TOKEN;

app.use('*', async (c, next) => {
  const authHeader = c.req.header('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token !== API_TOKEN) {
    return c.text('Unauthorized', 401);
  }
  await next();
});

app.delete('/delete', async (c) => {
  const relPath = c.req.query('path');
  if (!relPath) return c.json({ ok: false, error: 'missing path' }, 400);

  const baseDir = '/usr/local/srs/objs/nginx/html/';
  const resolvedBase = path.resolve(baseDir) + path.sep;
  const resolved = path.resolve(baseDir, relPath);

  const relativePath = path.relative(resolvedBase, resolved);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return c.json({ ok: false, error: 'invalid path' }, 400);
  }

  try {
    await fs.rm(resolved, { force: true });
    return c.json({ ok: true, deleted: relPath });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

app.get('/', (c) => c.text('deleter running'));

serve({
  fetch: app.fetch,
  port: Number(process.env.DELETER_PORT || 3000),
});
