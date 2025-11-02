import { test, expect } from 'bun:test';
import { BaseDAO } from '../../src/dao/BaseDao';
import { DaoUniqueViolationError } from '../../src/errors/DaoError';

// Create a tiny concrete subclass exposing mapError for testing
class TestDAO extends (BaseDAO as any) {
  public exposeMapError(err: any) {
    return (this as any).mapError(err);
  }
}

// Create instance bypassing protected constructor by using Object.create
const dao = Object.create(TestDAO.prototype) as InstanceType<typeof TestDAO>;

test('BaseDAO.mapError maps Postgres unique violation to DaoUniqueViolationError', () => {
  const pgErr = {
    name: 'PostgresError',
    code: '23505',
    constraint: 'users_email_key',
    message: 'duplicate key value violates unique constraint',
  };
  const mapped = dao.exposeMapError(pgErr);

  expect(mapped).toBeInstanceOf(DaoUniqueViolationError);
  expect(mapped.message).toContain('Unique constraint');
});
