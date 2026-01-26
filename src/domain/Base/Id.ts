/**
 * Abstract class representing an entity with a unique identifier (`id`).
 *
 * This class is used to enforce validation on the `id` value and throw a custom error if the `id` is invalid.
 * It can be extended by other classes that require an ID validation logic.
 *
 * @template E - The type of error that should be thrown when the ID is invalid.
 */
export abstract class BaseId<E> {
  /**
   * Creates an instance of BaseId.
   *
   * @param id - The identifier value that will be assigned to the entity.
   * @param ErrorClass - The error class that will be thrown if the ID is invalid (i.e., `id <= 0`).
   *
   * @throws {E} If the `id` is less than or equal to zero, the provided `ErrorClass` will be instantiated and thrown.
   */
  constructor(
    private readonly id: number,
    private readonly ErrorClass: new (id: number) => E,
  ) {
    if (id <= 0) {
      throw new this.ErrorClass(id); // Throws the custom error if the id is invalid
    }
  }

  /**
   * Gets the value of the ID.
   *
   * @returns {number} The ID of the entity.
   */
  get value(): number {
    return this.id;
  }
}
