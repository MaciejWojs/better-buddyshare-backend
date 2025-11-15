import { DaoConnectionError, RepositoryError } from '@src/errors';
import { test, expect } from 'bun:test';

test('RepositoryError.fromDaoError maps DaoConnectionError to 503 retryable', () => {
  const daoErr = new DaoConnectionError('DB connection lost', {
    code: '08001',
  });
  const repoErr = RepositoryError.fromDaoError(daoErr);

  expect(repoErr).toBeInstanceOf(RepositoryError);
  expect(repoErr.statusCode).toBe(503);
  expect(repoErr.retryable).toBe(true);
});
