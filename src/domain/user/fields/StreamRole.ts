import { Role, UserId } from '@src/domain';

export class StreamRole {
  constructor(
    readonly role: Role,
    readonly streamerId: UserId,
  ) {}
}
