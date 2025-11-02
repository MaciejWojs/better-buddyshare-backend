import { test, expect } from 'bun:test';
import { RepositoryError } from '../../src/errors/RepositoryError';
import {
  DaoCacheConnectionError,
  DaoCacheAuthenticationError,
} from '../../src/errors/DaoError';

test('RepositoryError.fromDaoError maps cache connection/auth errors to 503 retryable', () => {
  const conn = new DaoCacheConnectionError('Redis disconnected', {
    code: 'ERR_REDIS_CONNECTION_CLOSED',
  });
  const auth = new DaoCacheAuthenticationError('Redis auth failed', {
    code: 'ERR_REDIS_AUTHENTICATION_FAILED',
  });

  const r1 = RepositoryError.fromDaoError(conn as any);
  const r2 = RepositoryError.fromDaoError(auth as any);

  expect(r1.statusCode).toBe(503);
  expect(r1.retryable).toBe(true);
  expect(r2.statusCode).toBe(503);
  expect(r2.retryable).toBe(true);
});
