CREATE OR REPLACE FUNCTION generate_access_token(length INTEGER DEFAULT 16)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  IF length < 8 THEN
    RAISE EXCEPTION 'Access token length must be at least 8 characters';
  END IF;

  token := encode(gen_random_bytes(length), 'hex');

  RETURN token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_access_token(INTEGER) IS 'Generates a random access token of specified length using hexadecimal encoding. Minimum length is 8 characters.';


CREATE OR REPLACE FUNCTION check_if_user_exists(p_user_id INTEGER) 
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if a user with the given ID exists in the 'users' table
    SELECT EXISTS (
        SELECT 1
        FROM users
        WHERE user_id = p_user_id
    ) INTO user_exists;

    -- Return the result (TRUE if the user exists, FALSE otherwise)
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_if_user_exists(INTEGER) IS 'Checks if a user with the specified user ID exists in the database.';

DROP FUNCTION IF EXISTS create_user(p_username citext, p_email citext, p_password TEXT) CASCADE;

CREATE OR REPLACE FUNCTION create_user(
  p_username CITEXT,
  p_email CITEXT,
  p_password TEXT
)
RETURNS SETOF users AS $$
BEGIN
  -- 1 Check if a user with the same username or email already exists
  RETURN QUERY
  SELECT *
  FROM users
  WHERE username = p_username OR email = p_email;

  -- 2 If not found, insert a new user
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO users (username, email, password)
    VALUES (p_username, p_email, p_password)
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_user(CITEXT, CITEXT, TEXT) IS 'Creates a new user account if username and email do not already exist. Returns the newly created or existing user.';


DROP FUNCTION IF EXISTS get_user_by_id(INTEGER) CASCADE;

  -- SETOF users -> returns rows in the shape of the users table
CREATE OR REPLACE FUNCTION get_user_by_id(p_id INTEGER)
RETURNS SETOF users AS $$
BEGIN
  -- call check_if_user_exists(p_id);
  RETURN QUERY
  SELECT *
  FROM "users"
  WHERE "users".user_id = p_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_by_id(INTEGER) IS 'Retrieves a user by their user ID.';

DROP FUNCTION IF EXISTS get_user_by_email(p_email citext) CASCADE;

  -- SETOF users -> returns rows in the shape of the users table
CREATE OR REPLACE FUNCTION get_user_by_email(p_email citext)
RETURNS SETOF users AS $$
BEGIN
  -- call check_if_user_exists(p_id);
  RETURN QUERY
  SELECT *
  FROM "users"
  WHERE "users".email = p_email;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_by_email(CITEXT) IS 'Retrieves a user by their email address.';


DROP FUNCTION IF EXISTS ban_user_globally(p_user_id INTEGER,  p_reason TEXT) CASCADE;

CREATE OR REPLACE FUNCTION ban_user_globally(p_user_id INTEGER, p_reason TEXT DEFAULT 'Unknown reason')
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    is_banned = TRUE,
    ban_reason = p_reason
  WHERE "users".user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
  -- RETURNING *;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ban_user_globally(INTEGER, TEXT) IS 'Globally bans a user with a specified reason. The user is marked as banned in the system.';

DROP FUNCTION IF EXISTS unban_user_globally(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION unban_user_globally(p_user_id INTEGER)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    is_banned = FALSE,
    ban_reason = NULL,
    ban_expires_at = NULL
  WHERE "users".user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
  -- RETURNING *;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION unban_user_globally(INTEGER) IS 'Removes the global ban from a user, clearing the ban reason and expiration timestamp.';


DROP FUNCTION IF EXISTS update_user_description(p_user_id INTEGER, p_description TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_description(p_user_id INTEGER, p_description TEXT)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    description = p_description
  WHERE "users".user_id = p_user_id;
  
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_description(INTEGER, TEXT) IS 'Updates the description/bio of a user.';

DROP FUNCTION IF EXISTS update_user_avatar(p_user_id INTEGER, p_avatar TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_avatar(p_user_id INTEGER, p_avatar TEXT)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    avatar = p_avatar
  WHERE "users".user_id = p_user_id;
  
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_avatar(INTEGER, TEXT) IS 'Updates the avatar image URL for a user.';

DROP FUNCTION IF EXISTS update_user_profile_banner(p_user_id INTEGER, p_profile_banner TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_profile_banner(p_user_id INTEGER, p_profile_banner TEXT)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    profile_banner = p_profile_banner
  WHERE "users".user_id = p_user_id;
  
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_profile_banner(INTEGER, TEXT) IS 'Updates the profile banner image URL for a user.';

DROP FUNCTION IF EXISTS update_user_username(p_user_id INTEGER, p_username citext) CASCADE;

CREATE OR REPLACE FUNCTION update_user_username(p_user_id INTEGER, p_username citext)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    username = p_username
  WHERE "users".user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_username(INTEGER, CITEXT) IS 'Updates the username of a user.';


DROP FUNCTION IF EXISTS update_user_email(p_user_id INTEGER, p_email citext) CASCADE;

CREATE OR REPLACE FUNCTION update_user_email(p_user_id INTEGER, p_email citext)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    email = p_email
  WHERE "users".user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_email(INTEGER, CITEXT) IS 'Updates the email address of a user.';

DROP FUNCTION IF EXISTS update_user_password(p_user_id INTEGER, p_password TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_user_password(p_user_id INTEGER, p_password TEXT)
RETURNS SETOF users AS $$
BEGIN
  UPDATE "users" SET 
    password = p_password
  WHERE "users".user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_password(INTEGER, TEXT) IS 'Updates the password hash for a user.';

DROP FUNCTION IF EXISTS ban_user_in_chat CASCADE;

CREATE OR REPLACE FUNCTION ban_user_in_chat(p_streamer_id INTEGER, p_user_id INTEGER, p_banner_id INTEGER, p_reason TEXT DEFAULT 'Unknown reason', p_is_permanent BOOLEAN DEFAULT FALSE, p_ban_end_date TIMESTAMP DEFAULT NULL)
RETURNS SETOF banned_users_per_streamer AS $$
BEGIN
  RETURN QUERY
  INSERT INTO banned_users_per_streamer (
    streamer_id,
    user_id,
    banned_by,
    reason,
    is_permanent,
    banned_until
  ) VALUES (
    p_streamer_id,
    p_user_id,
    p_banner_id,
    p_reason,
    p_is_permanent,
    p_ban_end_date
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ban_user_in_chat(INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, TIMESTAMP) IS 'Bans a user from a streamer chat. Ban can be permanent or temporary with optional expiration date.';


CREATE OR REPLACE PROCEDURE HARD_DELETE_USER(p_user_id INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM users WHERE user_id = p_user_id;
END;
$$;

COMMENT ON PROCEDURE HARD_DELETE_USER(INTEGER) IS 'Permanently deletes a user and all associated data from the system.';


DROP FUNCTION IF EXISTS update_stream_token(p_user_id INTEGER, p_stream_token TEXT) CASCADE;

CREATE OR REPLACE FUNCTION update_stream_token(p_user_id INTEGER, p_stream_token TEXT)
RETURNS SETOF users AS $$
BEGIN
  UPDATE users SET 
    "stream_token" = p_stream_token
   WHERE users.user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_stream_token(INTEGER, TEXT) IS 'Updates the stream token for a user to the specified value.';

DROP FUNCTION IF EXISTS update_stream_token(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION update_stream_token(p_user_id INTEGER)
RETURNS SETOF users AS $$
BEGIN
  UPDATE users SET 
    "stream_token" = generate_access_token(32)
  WHERE users.user_id = p_user_id;
  RETURN QUERY SELECT * from get_user_by_id(p_user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_stream_token(INTEGER) IS 'Generates and assigns a new random stream token to a user.';

