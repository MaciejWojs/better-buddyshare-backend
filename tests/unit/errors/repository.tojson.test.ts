import { test, expect } from 'bun:test';
import { RepositoryError } from '@src/errors/RepositoryError';

test('RepositoryError.toJSON returns structured payload', () => {
  const err = new RepositoryError(
    'Something failed',
    undefined,
    { foo: 'bar' },
    500,
    true,
  );
  const json = err.toJSON();

  expect(json.message).toBe('Something failed');
  expect(json.details).toEqual({ foo: 'bar' });
  expect(json.statusCode).toBe(500);
  expect(json.retryable).toBe(true);
});
