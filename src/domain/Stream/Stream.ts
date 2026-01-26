import { UserId, StreamId, StreamTitle, StreamDescription } from '@src/domain';

export class Stream {
  constructor(
    readonly id: StreamId,
    readonly streamerId: UserId,
    readonly title: StreamTitle,
    readonly description: StreamDescription,
    readonly thumbnail: string,
    readonly isLive: boolean,
    readonly isPublic: boolean,
    readonly isLocked: boolean,
    readonly startedAt: Date,
    readonly endedAt?: Date,
    readonly path?: string,
  ) {}

  private copy(changes: Partial<Stream>): Stream {
    return new Stream(
      changes.id ?? this.id,
      changes.streamerId ?? this.streamerId,
      changes.title ?? this.title,
      changes.description ?? this.description,
      changes.thumbnail ?? this.thumbnail,
      changes.isLive ?? this.isLive,
      changes.isPublic ?? this.isPublic,
      changes.isLocked ?? this.isLocked,
      changes.startedAt ?? this.startedAt,
      changes.endedAt ?? this.endedAt,
      changes.path ?? this.path,
    );
  }

  updateTitle(newTitle: StreamTitle) {
    return this.copy({ title: newTitle });
  }

  updateDescription(newDescription: StreamDescription) {
    return this.copy({ description: newDescription });
  }

  updateThumbnail(newThumbnail: string) {
    return this.copy({ thumbnail: newThumbnail });
  }

  goLive(startedAt: Date = new Date()) {
    return this.copy({ isLive: true, startedAt });
  }

  endStream(endedAt: Date = new Date()) {
    return this.copy({ isLive: false, endedAt });
  }

  makePublic() {
    return this.copy({ isPublic: true });
  }

  makePrivate() {
    return this.copy({ isPublic: false });
  }

  lockStream() {
    return this.copy({ isLocked: true });
  }

  unlockStream() {
    return this.copy({ isLocked: false });
  }

  updatePath(newPath: string) {
    return this.copy({ path: newPath });
  }
}
