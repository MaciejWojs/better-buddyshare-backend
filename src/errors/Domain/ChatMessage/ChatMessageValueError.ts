import { BaseBelowMinLengthError, BaseExceedsMaxLengthError, BaseInvalidValueError, BaseProfanityError } from "@src/errors";

export class ChatMessageBelowMinLengthError extends BaseBelowMinLengthError {
    constructor(chatMessage: string, minLength: number) {
        super(chatMessage, minLength, 'chat message');
    }
}

export class ChatMessageExceedsMaxLengthError extends BaseExceedsMaxLengthError {
    constructor(chatMessage: string, maxLength: number) {
        super(chatMessage, maxLength, 'chat message');
    }
}

export class ChatMessageProfanityError extends BaseProfanityError {
    constructor(chatMessage: string) {
        super(chatMessage, 'chat message');
    }
}

export class ChatMessageInvalidValueError extends BaseInvalidValueError {
    constructor(chatMessage: string, message: string) {
        super(chatMessage, message, 'chat message');
    }
}