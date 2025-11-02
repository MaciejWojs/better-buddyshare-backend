import { test, expect } from 'bun:test';
import { BaseDAO } from '../../src/dao/BaseDao';

class TestDAO extends (BaseDAO as any) {
  public exposeMapError(err: any) {
    return (this as any).mapError(err);
  }
}

const dao = Object.create(TestDAO.prototype) as InstanceType<typeof TestDAO>;

test('BaseDAO.mapError falls back to DaoError for unknown errors', () => {
  const err = new Error('random failure');
  const mapped = dao.exposeMapError(err);

  expect(mapped).toBeInstanceOf(Error);
  expect((mapped as any).code).toBe('DAO_ERROR');
});

test('BaseDAO.executeQuery throws DaoError when query returns non-array', async () => {
  // create a fake query function returning non-array
  const fakeQuery = async () => ({ not: 'an array' });

  // call executeQuery via prototype to avoid constructor
  const exec = TestDAO.prototype.executeQuery as any;
  try {
    await exec.call(dao, fakeQuery);
    throw new Error('should have thrown');
  } catch (e: any) {
    expect((e as any).code).toBe('DAO_ERROR');
  }
});
