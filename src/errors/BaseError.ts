export abstract class BaseError extends Error {
  public readonly code: string;
  public override readonly cause?: unknown;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = cause;
    this.name = new.target.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
