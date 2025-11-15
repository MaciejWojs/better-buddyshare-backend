import {
  DaoError,
  DaoNotFoundError,
  RepositoryError,
  RepositoryConflictError,
  DaoUniqueViolationError,
  RepositoryNotFoundError,
} from '@src/errors';
import { test, expect } from 'bun:test';

test('RepositoryError.fromDaoError maps UniqueViolation to Conflict', () => {
  const daoErr = new DaoUniqueViolationError('users_email_key', {
    code: '23505',
  });
  const repoErr = RepositoryError.fromDaoError(daoErr as DaoError);

  expect(repoErr).toBeInstanceOf(RepositoryConflictError);
  expect(repoErr.statusCode).toBe(409);
});

test('RepositoryError.fromDaoError maps NotFound to NotFoundError', () => {
  const daoErr = new DaoNotFoundError('User', 123);
  const repoErr = RepositoryError.fromDaoError(daoErr as DaoError);

  expect(repoErr).toBeInstanceOf(RepositoryNotFoundError);
  expect(repoErr.statusCode).toBe(404);
});
