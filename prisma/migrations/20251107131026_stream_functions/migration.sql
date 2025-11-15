DROP FUNCTION IF EXISTS Check_if_user_is_streamer(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION Check_if_user_is_streamer(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    is_streamer BOOLEAN;
BEGIN
    SELECT EXISTS ( 
        SELECT 1 
        FROM users 
        WHERE user_id = p_user_id 
        AND (stream_token IS NOT NULL AND stream_token != '')
    ) INTO is_streamer;

    RETURN is_streamer;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS create_stream(p_streamer_id INTEGER, p_title TEXT, p_desc TEXT) CASCADE;
CREATE OR REPLACE FUNCTION create_stream(p_streamer_id INTEGER, p_title TEXT DEFAULT NULL, p_desc TEXT DEFAULT NULL)
RETURNS SETOF streams AS $$
DECLARE
    active_streams INT;
BEGIN

  IF NOT Check_if_user_is_streamer(p_streamer_id) THEN
    RAISE EXCEPTION 'User with ID % is not a streamer.', p_streamer_id;
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM streams
      WHERE streamer_id = p_streamer_id AND is_live = TRUE
  ) INTO active_streams;

  IF active_streams > 0 THEN
    RAISE EXCEPTION 'Streamer with ID % already has an active stream.', p_streamer_id;
  END IF;

  RETURN QUERY
  INSERT INTO streams (
    streamer_id,
    title,
    "description",
    is_live
  ) VALUES ( 
    p_streamer_id,
    COALESCE(p_title, 'Untitled Stream'),
    COALESCE(p_desc, 'No description provided'),
    TRUE
  ) RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS end_stream(p_stream_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION end_stream(p_stream_id INTEGER)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET ended_at = NOW(),
      is_live = FALSE
  WHERE stream_id = p_stream_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS end_all_streams_for_user(p_user_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION end_all_streams_for_user(p_user_id INTEGER)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET ended_at = NOW(),
      is_live = FALSE
  WHERE streamer_id = p_user_id AND is_live = TRUE
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS end_all_streams() CASCADE;
CREATE OR REPLACE FUNCTION end_all_streams()
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET ended_at = NOW(),
      is_live = FALSE
  WHERE is_live = TRUE
  RETURNING *;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS get_active_streams() CASCADE;
CREATE OR REPLACE FUNCTION get_active_streams()
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM streams
  WHERE is_live = TRUE AND is_public = TRUE;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS check_if_user_is_streaming(p_user_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION check_if_user_is_streaming(p_streamer_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    is_streaming BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM streams
        WHERE streamer_id = p_streamer_id
          AND is_live = TRUE
    ) INTO is_streaming;
    RETURN is_streaming;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS check_if_user_is_streaming_and_public(p_streamer_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION check_if_user_is_streaming_and_public(p_streamer_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    is_streaming BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM streams
        WHERE streamer_id = p_streamer_id
          AND is_live = TRUE
          AND is_public = TRUE
    ) INTO is_streaming;
    RETURN is_streaming;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_stream_by_id(p_stream_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_stream_by_id(p_stream_id INTEGER)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM streams
  WHERE stream_id = p_stream_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_streams_by_user_id(p_user_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_streams_by_user_id(p_user_id INTEGER)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM streams
  WHERE streamer_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS update_stream_details(p_stream_id INTEGER, p_title TEXT, p_desc TEXT, p_thumbnail TEXT) CASCADE;
CREATE OR REPLACE FUNCTION update_stream_details(p_stream_id INTEGER, p_title TEXT DEFAULT NULL, p_desc TEXT DEFAULT NULL, p_thumbnail TEXT DEFAULT NULL)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET title = COALESCE(p_title, "title"),
      description = COALESCE(p_desc, "description"),
      thumbnail = COALESCE(p_thumbnail, "thumbnail")
  WHERE stream_id = p_stream_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS set_stream_live_status(p_stream_id INTEGER, p_is_live BOOLEAN) CASCADE;
CREATE OR REPLACE FUNCTION set_stream_live_status(p_stream_id INTEGER, p_is_live BOOLEAN)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET is_live = p_is_live
  WHERE stream_id = p_stream_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS add_path_to_stream(p_stream_id INTEGER, p_path TEXT) CASCADE;
CREATE OR REPLACE FUNCTION add_path_to_stream(p_stream_id INTEGER, p_path TEXT)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET path = p_path
  WHERE stream_id = p_stream_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS set_stream_lock_status(p_stream_id INTEGER, p_is_locked BOOLEAN) CASCADE;
CREATE OR REPLACE FUNCTION set_stream_lock_status(p_stream_id INTEGER, p_is_locked BOOLEAN)
RETURNS SETOF streams AS $$
BEGIN
  RETURN QUERY
  UPDATE streams
  SET is_locked = p_is_locked
  WHERE stream_id = p_stream_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
