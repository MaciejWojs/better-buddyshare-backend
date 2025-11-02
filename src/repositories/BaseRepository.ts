import { DaoError } from '@src/errors/DaoError';
import { RepositoryError } from '@src/errors/RepositoryError';

export class BaseRepository {
  private formatForLog(err: unknown) {
    if (err instanceof RepositoryError) return err.toJSON();
    if (err instanceof DaoError)
      return {
        message: err.message,
        code: (err as any).cause?.code ?? undefined,
      };
    return { message: (err as any)?.message ?? String(err) };
  }

  private handleError(error: unknown): never {
    // If this came from DAO and is a DaoError, map to RepositoryError
    if (error instanceof DaoError) {
      const repoErr = RepositoryError.fromDaoError(error);
      console.error('[REPO ERROR]', this.formatForLog(repoErr));
      throw repoErr;
    }

    // If already a RepositoryError, rethrow after logging
    if (error instanceof RepositoryError) {
      console.error('[REPO ERROR]', this.formatForLog(error));
      throw error;
    }

    // Otherwise wrap into generic RepositoryError
    const wrapped = new RepositoryError(
      (error as any)?.message ?? 'Repository error',
      error,
    );
    console.error('[REPO ERROR]', this.formatForLog(wrapped));
    throw wrapped;
  }

  protected async safeDaoCall<T>(
    daoCall: Promise<T | null>,
  ): Promise<T | null> {
    try {
      const result = await daoCall;
      if (!result) return null;
      if (Array.isArray(result) && result.length !== 0) {
        console.log('Returning first element from array result in safeDaoCall');
        return result[0] as T;
      }
      console.log('Returning non-array result in safeDaoCall');
      return result as T;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  protected async safeDaoCallMultiple<T>(
    daoCall: Promise<T[] | null>,
  ): Promise<T[] | null> {
    try {
      const result = await daoCall;
      return (result ?? null) as T[] | null;
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
