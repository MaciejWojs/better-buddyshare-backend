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


CREATE OR REPLACE PROCEDURE HARD_DELETE_USER(p_user_id INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM users WHERE user_id = p_user_id;
END;
$$;