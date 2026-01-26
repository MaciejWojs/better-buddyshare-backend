import { InvalidIdError } from "@src/errors";

export class InvalidStreamIdError extends InvalidIdError {
    constructor(id: number) {
        super(id, 'stream');
    }
}