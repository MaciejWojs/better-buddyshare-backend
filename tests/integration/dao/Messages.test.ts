import { describe, it, expect, beforeAll } from 'bun:test';
import { UserDAO, StreamsDAO, MessagesDAO } from '../../test-setup';

let streamId: number;
let userId: number;

describe('MessagesDAO – integration tests', () => {
  beforeAll(async () => {
    // Tworzymy użytkownika i stream potrzebne do testów
    const createdUser = await UserDAO.createUser(
      'test',
      'testuser@example.com',
      'hashedpassword',
    );

    userId = createdUser.user_id;

    await UserDAO.updateStreamToken(userId);

    const createdStream = await StreamsDAO.createStream(
      userId,
      'Test Stream',
      'This is a test stream',
    );
    streamId = createdStream.stream_id;
  });

  // Helper
  const createMessage = (content: string) =>
    MessagesDAO.createChatMessage(streamId, userId, content);

  // ----------------------------------------------------------------------

  it('should create a message', async () => {
    const msg = await createMessage('hello world');
    expect(msg).not.toBeNull();
    expect(msg!.content).toBe('hello world');
    expect(msg!.stream_id).toBe(streamId);
    expect(msg!.user_id).toBe(userId);
  });

  it('should get chat messages', async () => {
    await createMessage('m1');
    await createMessage('m2');

    const msgs = await MessagesDAO.getChatMessages(streamId, 10, 0);
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    expect(msgs[0]).toHaveProperty('message_id');
  });

  it('should check if message exists', async () => {
    const msg = await createMessage('exists?');
    const exists = await MessagesDAO.checkIfMessageExists(msg!.message_id);
    expect(exists).toBe(true);

    const notExists = await MessagesDAO.checkIfMessageExists(999999);
    expect(notExists).toBe(false);
  });

  it('should edit a chat message and save history', async () => {
    const msg = await createMessage('old content');
    const edited = await MessagesDAO.editChatMessage(
      msg!.message_id,
      'new content',
    );

    expect(edited).toBe(true);

    const history = await MessagesDAO.getMessageEditHistory(msg!.message_id);
    expect(history.length).toBe(1);
    expect(history[0].old_content).toBe('old content');
  });

  it('should soft delete a message', async () => {
    const msg = await createMessage('to delete');

    const deleted = await MessagesDAO.deleteChatMessage(msg!.message_id);
    expect(deleted).toBe(true);

    const messages = await MessagesDAO.getChatMessages(streamId);
    const found = messages.find((m) => m.message_id === msg.message_id);
    expect(found).toBeUndefined();
  });

  it('should undelete a message', async () => {
    const msg = await createMessage('to undelete');
    await MessagesDAO.deleteChatMessage(msg!.message_id);

    const restored = await MessagesDAO.undeleteChatMessage(msg!.message_id);
    expect(restored).toBe(true);

    const messages = await MessagesDAO.getChatMessages(streamId);
    const found = messages.find((m) => m.message_id === msg.message_id);
    expect(found).toBeDefined();
  });

  it('should count chat messages', async () => {
    const count = await MessagesDAO.countChatMessages(streamId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('should return last message', async () => {
    await createMessage('last-message');
    const last = await MessagesDAO.getLastMessage(streamId);

    expect(last).not.toBeNull();
    expect(last!.content).toBe('last-message');
  });

  it('should check if user is message author', async () => {
    const msg = await createMessage('author test');
    const isAuthor = await MessagesDAO.isUserMessageAuthor(
      msg!.message_id,
      userId,
    );
    const notAuthor = await MessagesDAO.isUserMessageAuthor(
      msg!.message_id,
      userId + 999,
    );

    expect(isAuthor).toBe(true);
    expect(notAuthor).toBe(false);
  });

  it('should count message edits', async () => {
    const msg = await createMessage('edit count');
    await MessagesDAO.editChatMessage(msg!.message_id, 'edited 1');
    await MessagesDAO.editChatMessage(msg!.message_id, 'edited 2');

    const count = await MessagesDAO.countMessageEdits(msg!.message_id);
    expect(count).toBe(2);
  });

  it('should get deleted messages', async () => {
    const msg = await createMessage('deleted msg');
    await MessagesDAO.deleteChatMessage(msg!.message_id);

    const list = await MessagesDAO.getDeletedMessages(streamId);
    expect(list.map((m) => m.message_id)).toContain(msg!.message_id);
  });

  it('should undelete all messages', async () => {
    await createMessage('d1').then((m) =>
      MessagesDAO.deleteChatMessage(m!.message_id),
    );
    await createMessage('d2').then((m) =>
      MessagesDAO.deleteChatMessage(m!.message_id),
    );

    const restoredCount = await MessagesDAO.undeleteAllChatMessages(streamId);
    expect(restoredCount).toBeGreaterThanOrEqual(2);
  });

  it('should hard delete message', async () => {
    const msg = await createMessage('hard delete me');

    const ok = await MessagesDAO.hardDeleteChatMessage(msg!.message_id);
    expect(ok).toBe(true);

    const exists = await MessagesDAO.checkIfMessageExists(msg!.message_id);
    expect(exists).toBe(false);
  });

  it('should get deleted messages paginated', async () => {
    const msg = await createMessage('paginated-deleted');
    await MessagesDAO.deleteChatMessage(msg!.message_id);

    const page = await MessagesDAO.getDeletedMessagesPaginated(streamId, 10, 0);

    expect(page.length).toBeGreaterThan(0);
    expect(page[0]).toHaveProperty('is_deleted', true);
  });

  it('should get edit history paginated', async () => {
    const msg = await createMessage('hist');
    await MessagesDAO.editChatMessage(msg!.message_id, 'v1');
    await MessagesDAO.editChatMessage(msg!.message_id, 'v2');

    const page = await MessagesDAO.getMessageEditHistoryPaginated(
      msg!.message_id,
      1,
      0,
    );

    expect(page.length).toBe(1);
  });

  it('should get user messages paginated', async () => {
    await createMessage('user1');
    await createMessage('user2');

    const page = await MessagesDAO.getUserMessagesPaginated(
      streamId,
      userId,
      10,
      0,
    );
    expect(page.length).toBeGreaterThan(0);
    expect(page[0].user_id).toBe(userId);
  });

  it('should get all messages paginated', async () => {
    const page = await MessagesDAO.getAllMessagesPaginated(streamId, 10, 0);
    expect(page.length).toBeGreaterThan(0);
    expect(page[0]).toHaveProperty('stream_id', streamId);
  });
});
