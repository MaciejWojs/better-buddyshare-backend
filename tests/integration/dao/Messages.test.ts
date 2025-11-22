import { describe, it, expect, beforeAll } from 'bun:test';
import { MessagesDAO, UserDAO, StreamsDAO } from '@src/dao/';

let dao: MessagesDAO;
let userDao: UserDAO;
let streamDao: StreamsDAO;
let streamId: number;
let userId: number;

describe('MessagesDAO – integration tests', () => {
  beforeAll(async () => {
    dao = MessagesDAO.getInstance();
    userDao = UserDAO.getInstance();
    streamDao = StreamsDAO.getInstance();

    // Tworzymy użytkownika i stream potrzebne do testów
    const createdUser = await userDao.createUser(
      'test',
      'testuser@example.com',
      'hashedpassword',
    );

    userId = createdUser.user_id;

    await userDao.updateStreamToken(userId);

    const createdStream = await streamDao.createStream(
      userId,
      'Test Stream',
      'This is a test stream',
    );
    streamId = createdStream.stream_id;
  });

  // Helper
  const createMessage = (content: string) =>
    dao.createChatMessage(streamId, userId, content);

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

    const msgs = await dao.getChatMessages(streamId, 10, 0);
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    expect(msgs[0]).toHaveProperty('message_id');
  });

  it('should check if message exists', async () => {
    const msg = await createMessage('exists?');
    const exists = await dao.checkIfMessageExists(msg!.message_id);
    expect(exists).toBe(true);

    const notExists = await dao.checkIfMessageExists(999999);
    expect(notExists).toBe(false);
  });

  it('should edit a chat message and save history', async () => {
    const msg = await createMessage('old content');
    const edited = await dao.editChatMessage(msg!.message_id, 'new content');

    expect(edited).toBe(true);

    const history = await dao.getMessageEditHistory(msg!.message_id);
    expect(history.length).toBe(1);
    expect(history[0].old_content).toBe('old content');
  });

  it('should soft delete a message', async () => {
    const msg = await createMessage('to delete');

    const deleted = await dao.deleteChatMessage(msg!.message_id);
    expect(deleted).toBe(true);

    const messages = await dao.getChatMessages(streamId);
    const found = messages.find((m) => m.message_id === msg.message_id);
    expect(found).toBeUndefined();
  });

  it('should undelete a message', async () => {
    const msg = await createMessage('to undelete');
    await dao.deleteChatMessage(msg!.message_id);

    const restored = await dao.undeleteChatMessage(msg!.message_id);
    expect(restored).toBe(true);

    const messages = await dao.getChatMessages(streamId);
    const found = messages.find((m) => m.message_id === msg.message_id);
    expect(found).toBeDefined();
  });

  it('should count chat messages', async () => {
    const count = await dao.countChatMessages(streamId);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('should return last message', async () => {
    await createMessage('last-message');
    const last = await dao.getLastMessage(streamId);

    expect(last).not.toBeNull();
    expect(last!.content).toBe('last-message');
  });

  it('should check if user is message author', async () => {
    const msg = await createMessage('author test');
    const isAuthor = await dao.isUserMessageAuthor(msg!.message_id, userId);
    const notAuthor = await dao.isUserMessageAuthor(
      msg!.message_id,
      userId + 999,
    );

    expect(isAuthor).toBe(true);
    expect(notAuthor).toBe(false);
  });

  it('should count message edits', async () => {
    const msg = await createMessage('edit count');
    await dao.editChatMessage(msg!.message_id, 'edited 1');
    await dao.editChatMessage(msg!.message_id, 'edited 2');

    const count = await dao.countMessageEdits(msg!.message_id);
    expect(count).toBe(2);
  });

  it('should get deleted messages', async () => {
    const msg = await createMessage('deleted msg');
    await dao.deleteChatMessage(msg!.message_id);

    const list = await dao.getDeletedMessages(streamId);
    expect(list.map((m) => m.message_id)).toContain(msg!.message_id);
  });

  it('should undelete all messages', async () => {
    await createMessage('d1').then((m) => dao.deleteChatMessage(m!.message_id));
    await createMessage('d2').then((m) => dao.deleteChatMessage(m!.message_id));

    const restoredCount = await dao.undeleteAllChatMessages(streamId);
    expect(restoredCount).toBeGreaterThanOrEqual(2);
  });

  it('should hard delete message', async () => {
    const msg = await createMessage('hard delete me');

    const ok = await dao.hardDeleteChatMessage(msg!.message_id);
    expect(ok).toBe(true);

    const exists = await dao.checkIfMessageExists(msg!.message_id);
    expect(exists).toBe(false);
  });

  it('should get deleted messages paginated', async () => {
    const msg = await createMessage('paginated-deleted');
    await dao.deleteChatMessage(msg!.message_id);

    const page = await dao.getDeletedMessagesPaginated(streamId, 10, 0);

    expect(page.length).toBeGreaterThan(0);
    expect(page[0]).toHaveProperty('is_deleted', true);
  });

  it('should get edit history paginated', async () => {
    const msg = await createMessage('hist');
    await dao.editChatMessage(msg!.message_id, 'v1');
    await dao.editChatMessage(msg!.message_id, 'v2');

    const page = await dao.getMessageEditHistoryPaginated(
      msg!.message_id,
      1,
      0,
    );

    expect(page.length).toBe(1);
  });

  it('should get user messages paginated', async () => {
    await createMessage('user1');
    await createMessage('user2');

    const page = await dao.getUserMessagesPaginated(streamId, userId, 10, 0);
    expect(page.length).toBeGreaterThan(0);
    expect(page[0].user_id).toBe(userId);
  });

  it('should get all messages paginated', async () => {
    const page = await dao.getAllMessagesPaginated(streamId, 10, 0);
    expect(page.length).toBeGreaterThan(0);
    expect(page[0]).toHaveProperty('stream_id', streamId);
  });
});
