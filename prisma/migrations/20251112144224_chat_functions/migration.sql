-- Chat Message Management Functions
-- This migration adds comprehensive functions for managing stream chat messages with edit history and soft delete support

-- Chat message management functions (ChatMessage):

-- 1. Create a new chat message

CREATE FUNCTION create_chat_message(p_stream_id INT, p_user_id INT, p_content TEXT) RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    RETURN QUERY
    INSERT INTO chat_messages (stream_id, user_id, content)
    VALUES (p_stream_id, p_user_id, p_content)
    RETURNING *;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION create_chat_message(INT, INT, TEXT) IS 'Creates a new chat message in a stream and returns the created message.';


-- 2. Get messages for a given stream (with pagination, excluding deleted)
CREATE OR REPLACE FUNCTION get_chat_messages(
    p_stream_id INT,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
) 
RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    RETURN QUERY
    SELECT *
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND is_deleted = FALSE
    ORDER BY sent_at DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_chat_messages(INT, INT, INT) 
IS 'Returns paginated chat messages for a given stream, excluding deleted messages.';

-- 3. Check if message exists
DROP FUNCTION IF EXISTS check_if_message_exists(p_message_id INT) CASCADE;

CREATE OR REPLACE FUNCTION check_if_message_exists(p_message_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM chat_messages
        WHERE message_id = p_message_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_if_message_exists(INT)
IS 'Checks if a chat message with the given ID exists.';


-- 4. Edit chat message
CREATE OR REPLACE FUNCTION edit_chat_message(
    p_message_id INT,
    p_new_content TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_content TEXT;
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    SELECT content INTO v_old_content
    FROM chat_messages
    WHERE message_id = p_message_id;

    INSERT INTO chat_message_edit_histories (message_id, old_content)
    VALUES (p_message_id, v_old_content);

    UPDATE chat_messages
    SET content = p_new_content
    WHERE message_id = p_message_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION edit_chat_message(INT, TEXT)
IS 'Updates the content of a chat message and records the old content in the edit history.';

-- 5. Delete chat message (soft delete)
CREATE OR REPLACE FUNCTION delete_chat_message(p_message_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    UPDATE chat_messages
    SET is_deleted = TRUE
    WHERE message_id = p_message_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_chat_message(INT)
IS 'Marks a chat message as deleted (soft delete).';


-- 6. Get message edit history
CREATE OR REPLACE FUNCTION get_message_edit_history(p_message_id INT)
RETURNS SETOF chat_message_edit_histories AS $$
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT *
    FROM chat_message_edit_histories
    WHERE message_id = p_message_id
    ORDER BY edited_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_message_edit_history(INT)
IS 'Returns the edit history for a given chat message, sorted by most recent first.';

-- 7. Restore deleted message (soft undelete)
CREATE OR REPLACE FUNCTION undelete_chat_message(p_message_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    UPDATE chat_messages
    SET is_deleted = FALSE
    WHERE message_id = p_message_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION undelete_chat_message(INT)
IS 'Restores a previously deleted chat message.';


-- 8. Get number of messages in a stream
CREATE OR REPLACE FUNCTION count_chat_messages(p_stream_id INT)
RETURNS INT AS $$
DECLARE
    message_count INT;
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT COUNT(*)
    INTO message_count
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND is_deleted = FALSE;

    RETURN message_count;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION count_chat_messages(INT)
IS 'Returns the number of non-deleted chat messages in a given stream.';

-- 9. Get last message in a stream
CREATE OR REPLACE FUNCTION get_last_message(p_stream_id INT)
RETURNS chat_messages AS $$
DECLARE
    last_msg chat_messages;
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT *
    INTO last_msg
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND is_deleted = FALSE
    ORDER BY sent_at DESC
    LIMIT 1;

    RETURN last_msg;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_last_message(INT)
IS 'Returns the most recent non-deleted chat message in a given stream.';

-- 10. Check if user is the author of a message
CREATE OR REPLACE FUNCTION is_user_message_author(p_message_id INT, p_user_id INT)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM chat_messages
        WHERE message_id = p_message_id
          AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION is_user_message_author(INT, INT)
IS 'Checks if the specified user is the author of the given chat message.';

-- 11. Count message edits
CREATE OR REPLACE FUNCTION count_message_edits(p_message_id INT)
RETURNS INT AS $$
DECLARE
    edit_count INT;
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    SELECT COUNT(*) INTO edit_count
    FROM chat_message_edit_histories
    WHERE message_id = p_message_id;

    RETURN edit_count;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION count_message_edits(INT)
IS 'Returns the number of edits made to a given chat message.';

-- 12. Get all deleted messages in stream
CREATE OR REPLACE FUNCTION get_deleted_messages(p_stream_id INT)
RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    RETURN QUERY
    SELECT *
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND is_deleted = TRUE
    ORDER BY sent_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_deleted_messages(INT)
IS 'Returns all deleted chat messages in a given stream.';

-- 13. Restore all deleted messages in a stream
CREATE OR REPLACE FUNCTION undelete_all_chat_messages(p_stream_id INT)
RETURNS INT AS $$
DECLARE
    restored_count INT;
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    UPDATE chat_messages
    SET is_deleted = FALSE
    WHERE stream_id = p_stream_id
      AND is_deleted = TRUE;

    GET DIAGNOSTICS restored_count = ROW_COUNT;
    RETURN restored_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION undelete_all_chat_messages(INT)
IS 'Restores all deleted chat messages in a given stream and returns the count of restored messages.';

-- 14. Hard delete a chat message
DROP FUNCTION IF EXISTS hard_delete_chat_message(INT);

CREATE FUNCTION hard_delete_chat_message(p_message_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM chat_messages
    WHERE message_id = p_message_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION hard_delete_chat_message(INT)
IS 'Permanently deletes a chat message from the database and returns TRUE if a row was deleted, FALSE otherwise.';

-- 15. Get deleted messages in stream with pagination
CREATE OR REPLACE FUNCTION get_deleted_messages_paginated(
    p_stream_id INT,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
) 
RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    RETURN QUERY
    SELECT *
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND is_deleted = TRUE
    ORDER BY sent_at DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_deleted_messages_paginated(INT, INT, INT)
IS 'Returns deleted chat messages in a stream, paginated with optional LIMIT and OFFSET.';

-- 16. Get message edit history with pagination
CREATE OR REPLACE FUNCTION get_message_edit_history_paginated(
    p_message_id INT,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
) 
RETURNS SETOF chat_message_edit_histories AS $$
BEGIN
    IF NOT check_if_message_exists(p_message_id) THEN
        RAISE EXCEPTION 'Chat message with ID % does not exist.', p_message_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    SELECT *
    FROM chat_message_edit_histories
    WHERE message_id = p_message_id
    ORDER BY edited_at DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_message_edit_history_paginated(INT, INT, INT)
IS 'Returns the edit history for a chat message, paginated with optional LIMIT and OFFSET.';

-- 17. Get all user messages in stream with pagination
CREATE OR REPLACE FUNCTION get_user_messages_paginated(
    p_stream_id INT,
    p_user_id INT,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
) 
RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
    RETURN QUERY
    SELECT *
    FROM chat_messages
    WHERE stream_id = p_stream_id
      AND user_id = p_user_id
      AND is_deleted = FALSE
    ORDER BY sent_at DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_messages_paginated(INT, INT, INT, INT)
IS 'Returns all non-deleted chat messages from a specific user in a stream, paginated.';

-- 18. Get all messages in stream with pagination (including deleted)
CREATE OR REPLACE FUNCTION get_all_messages_paginated(
    p_stream_id INT,
    p_limit INT DEFAULT NULL,
    p_offset INT DEFAULT NULL
) 
RETURNS SETOF chat_messages AS $$
BEGIN
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;
    RETURN QUERY
    SELECT *
    FROM chat_messages
    WHERE stream_id = p_stream_id
    ORDER BY sent_at DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_all_messages_paginated(INT, INT, INT)
IS 'Returns all chat messages in a stream, including deleted ones, paginated.';
