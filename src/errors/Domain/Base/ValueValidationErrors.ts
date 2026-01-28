import { BaseDomainError } from '../BaseDomainError';

/**
 * Base error class for invalid values.
 * This class extends the `BaseDomainError` and is used when an invalid value is detected in an object.
 */
export abstract class BaseInvalidValueError extends BaseDomainError {
  /**
   * Creates an instance of BaseInvalidValueError.
   *
   * @param objectValue - The invalid value that caused the error.
   * @param message - The detailed error message.
   * @param objectName - The name of the object or entity related to the error.
   */
  constructor(objectValue: string, message: string, objectName: string) {
    super(`Invalid ${objectName} "${objectValue}":`, message);
  }
}

/**
 * Base error class for detecting profanity in values.
 * This class extends `BaseDomainError` and is thrown when an object contains inappropriate language.
 */
export abstract class BaseProfanityError extends BaseDomainError {
  /**
   * Creates an instance of BaseProfanityError.
   *
   * @param objectValue - The value that contains inappropriate language.
   * @param objectName - The name of the object or entity that contains profanity.
   */
  constructor(objectValue: string, objectName: string) {
    super(
      `The ${objectName} '${objectValue}' contains inappropriate language.`,
    );
  }
}

/**
 * Base error class for exceeding maximum length constraints.
 * This class extends `BaseDomainError` and is used when an object's value exceeds a predefined maximum length.
 */
export abstract class BaseExceedsMaxLengthError extends BaseDomainError {
  /**
   * Creates an instance of BaseExceedsMaxLengthError.
   *
   * @param objectValue - The value that exceeds the maximum length.
   * @param maxLength - The maximum allowed length for the object value.
   * @param objectName - The name of the object or entity with the value.
   */
  constructor(objectValue: string, maxLength: number, objectName: string) {
    super(
      `The ${objectName} '${objectValue}' exceeds the maximum length of ${maxLength} characters.`,
    );
  }
}

/**
 * Base error class for values that are shorter than the minimum length.
 * This class extends `BaseDomainError` and is thrown when an object value is below a required minimum length.
 */
export abstract class BaseBelowMinLengthError extends BaseDomainError {
  /**
   * Creates an instance of BaseBelowMinLengthError.
   *
   * @param objectValue - The value that is shorter than the minimum length.
   * @param minLength - The minimum required length for the object value.
   * @param objectName - The name of the object or entity with the value.
   */
  constructor(objectValue: string, minLength: number, objectName: string) {
    super(
      `The ${objectName} '${objectValue}' is shorter than the minimum length of ${minLength} characters.`,
    );
  }
}
