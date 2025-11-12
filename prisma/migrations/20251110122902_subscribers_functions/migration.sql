-- subscription_exists(p_user_id INTEGER, p_streamer_id INTEGER)
DROP FUNCTION IF EXISTS subscription_exists(p_user_id INTEGER, p_streamer_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION subscription_exists(p_user_id INTEGER, p_streamer_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM subscribers
        WHERE user_id = p_user_id AND streamer_id = p_streamer_id
    ) INTO exists;
    RETURN exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION subscription_exists(INTEGER, INTEGER) IS 'Checks if a subscription relationship already exists between a user and a streamer.';


-- add_subscription(p_user_id INTEGER, p_streamer_id INTEGER)
DROP FUNCTION IF EXISTS add_subscription(p_user_id INTEGER, p_streamer_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION add_subscription(p_user_id INTEGER, p_streamer_id INTEGER) 
RETURNS SETOF subscribers AS $$
BEGIN
    -- Check if the streamer exists
    IF NOT check_if_user_exists(p_streamer_id) THEN
        RAISE EXCEPTION 'Streamer with ID % does not exist.', p_streamer_id;
    END IF;

    -- Check if the user is a streamer
    IF NOT check_if_user_is_streamer(p_streamer_id) THEN
        RAISE EXCEPTION 'User with ID % is not a streamer.', p_streamer_id;
    END IF;

    -- Check if the subscriber exists
    IF NOT check_if_user_exists(p_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist.', p_user_id;
    END IF;

    -- Check if the subscription already exists
    IF subscription_exists(p_user_id, p_streamer_id) THEN
        -- If subscription exists, return it
        RETURN QUERY 
        SELECT * 
        FROM subscribers 
        WHERE user_id = p_user_id AND streamer_id = p_streamer_id;
    ELSE
        -- Otherwise, insert the subscription and return the newly inserted row
        RETURN QUERY
        INSERT INTO subscribers (user_id, streamer_id)
        VALUES (p_user_id, p_streamer_id)
        RETURNING *;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_subscription(INTEGER, INTEGER) IS 'Adds a subscription from a user to a streamer. Returns existing subscription if already subscribed, otherwise creates new subscription.';



-- remove_subscription(p_user_id INTEGER, p_streamer_id INTEGER)
DROP FUNCTION IF EXISTS remove_subscription(p_user_id INTEGER, p_streamer_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION remove_subscription(p_user_id INTEGER, p_streamer_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the subscription exists before attempting to delete it
    IF NOT EXISTS (
        SELECT 1
        FROM subscribers
        WHERE user_id = p_user_id AND streamer_id = p_streamer_id
    ) THEN
        -- If the subscription does not exist, return FALSE
        RETURN FALSE;
    END IF;

    -- Perform the DELETE operation
    DELETE FROM subscribers
    WHERE user_id = p_user_id AND streamer_id = p_streamer_id;

    -- Return TRUE if a row was deleted, FALSE if no row was deleted
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_subscription(INTEGER, INTEGER) IS 'Removes a subscription between a user and streamer. Returns TRUE if subscription was deleted, FALSE if it did not exist.';


-- get_subscriptions_by_user(p_user_id INTEGER)
-- Used to get my subscriptions as a user/viewer
DROP FUNCTION IF EXISTS get_subscriptions_by_user(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscriptions_by_user(p_user_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    username CITEXT,
    subscribed_since TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.user_id, u.username, s.subscribed_since
    FROM subscribers s
    JOIN users u ON s.streamer_id = u.user_id
    WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscriptions_by_user(INTEGER) IS 'Retrieves all streamers that a user is subscribed to with subscription timestamps.';

-- get_subscribers_by_streamer(p_streamer_id INTEGER) 
-- Used to get my subscribers as a streamer
DROP FUNCTION IF EXISTS get_subscribers_by_streamer(p_streamer_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscribers_by_streamer(p_streamer_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    username CITEXT,
    subscribed_since TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.user_id, u.username, s.subscribed_since
    FROM subscribers s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.streamer_id = p_streamer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscribers_by_streamer(INTEGER) IS 'Retrieves all users subscribed to a streamer with subscription timestamps.';


-- get_subscription_count_by_user(p_user_id INTEGER)
DROP FUNCTION IF EXISTS get_subscription_count_by_user(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscription_count_by_user(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    subscription_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscription_count
    FROM subscribers
    WHERE user_id = p_user_id;
    RETURN subscription_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscription_count_by_user(INTEGER) IS 'Returns the number of streamers a user is subscribed to.';

-- get_subscription_count_by_streamer(p_streamer_id INTEGER)

DROP FUNCTION IF EXISTS get_subscription_count_by_streamer(p_streamer_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_subscription_count_by_streamer(p_streamer_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    subscriber_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subscriber_count
    FROM subscribers
    WHERE streamer_id = p_streamer_id;
    RETURN subscriber_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscription_count_by_streamer(INTEGER) IS 'Returns the number of subscribers for a streamer.';

-- get_subscribers_paginated(p_streamer_id INTEGER, p_limit INTEGER, p_offset INTEGER)
DROP FUNCTION IF EXISTS get_subscribers_paginated(p_streamer_id INTEGER, p_limit INTEGER, p_offset INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscribers_paginated(
    p_streamer_id INTEGER, 
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id INTEGER,
    username CITEXT,
    subscribed_since TIMESTAMP(3)
) AS $$
BEGIN
    -- Negative limit check
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'Offset value cannot be negative';
    END IF;

    RETURN QUERY
    SELECT s.user_id, u.username, s.subscribed_since
    FROM subscribers s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.streamer_id = p_streamer_id
    ORDER BY s.subscribed_since DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscribers_paginated(INTEGER, INTEGER, INTEGER) IS 'Retrieves subscribers for a streamer with pagination, sorted by subscription date.';

-- get_subscriptions_paginated(p_user_id INTEGER, p_limit INTEGER, p_offset INTEGER)
DROP FUNCTION IF EXISTS get_subscriptions_paginated(p_user_id INTEGER, p_limit INTEGER, p_offset INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscriptions_paginated(
    p_user_id INTEGER, 
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    streamer_id INTEGER,
    username CITEXT,
    subscribed_since TIMESTAMP(3)
) AS $$
BEGIN
    -- Negative limit check
    IF p_offset < 0 THEN
        RAISE EXCEPTION 'Offset value cannot be negative';
    END IF;
    RETURN QUERY
    SELECT s.streamer_id, u.username, s.subscribed_since
    FROM subscribers s
    JOIN users u ON s.streamer_id = u.user_id
    WHERE s.user_id = p_user_id
    ORDER BY s.subscribed_since DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscriptions_paginated(INTEGER, INTEGER, INTEGER) IS 'Retrieves subscriptions for a user with pagination, sorted by subscription date.';

-- remove_all_subscriptions_by_user(p_user_id INTEGER)
DROP FUNCTION IF EXISTS remove_all_subscriptions_by_user(p_user_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION remove_all_subscriptions_by_user(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM subscribers
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_all_subscriptions_by_user(INTEGER) IS 'Removes all subscriptions from a user and returns count of deleted subscriptions.';

-- remove_all_subscribers_by_streamer(p_streamer_id INTEGER)
DROP FUNCTION IF EXISTS remove_all_subscribers_by_streamer(p_streamer_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION remove_all_subscribers_by_streamer(p_streamer_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM subscribers
    WHERE streamer_id = p_streamer_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_all_subscribers_by_streamer(INTEGER) IS 'Removes all subscribers from a streamer and returns count of deleted subscriptions.';

-- get_subscriber_details(p_subscriber_id INTEGER)
DROP FUNCTION IF EXISTS get_subscriber_details(p_user_id INTEGER, p_streamer_id INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_subscription_details(p_user_id INTEGER, p_streamer_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    streamer_id INTEGER,
    subscribed_since TIMESTAMP(3),
    streamer_username CITEXT,
    user_username CITEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.user_id,
        s.streamer_id,
        s.subscribed_since,
        su.username AS streamer_username,
        u.username AS user_username
    FROM subscribers s
    JOIN users su ON s.streamer_id = su.user_id
    JOIN users u ON s.user_id = u.user_id
    WHERE s.user_id = p_user_id AND s.streamer_id = p_streamer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_subscription_details(INTEGER, INTEGER) IS 'Retrieves detailed subscription information including both usernames for a specific user-streamer relationship.';

-- get_top_streamers_by_subscribers(p_limit INTEGER)
DROP FUNCTION IF EXISTS get_top_streamers_by_subscribers(p_limit INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_top_streamers_by_subscribers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    streamer_id INTEGER,
    username CITEXT,
    subscriber_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.streamer_id,
        u.username,
        COUNT(s.user_id)::int AS subscriber_count
    FROM subscribers s
    JOIN users u ON s.streamer_id = u.user_id
    GROUP BY s.streamer_id, u.username
    ORDER BY subscriber_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_streamers_by_subscribers(INTEGER) IS 'Retrieves the top streamers ranked by subscriber count, useful for discovery features.';

-- get_recent_subscriptions_by_user(p_user_id INTEGER, p_limit INTEGER)
DROP FUNCTION IF EXISTS get_recent_subscriptions_by_user(p_user_id INTEGER, p_limit INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_recent_subscriptions_by_user(p_user_id INTEGER, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    streamer_id INTEGER,
    username CITEXT,
    subscribed_since TIMESTAMP(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.streamer_id,
        u.username,
        s.subscribed_since
    FROM subscribers s
    JOIN users u ON s.streamer_id = u.user_id
    WHERE s.user_id = p_user_id
    ORDER BY s.subscribed_since DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recent_subscriptions_by_user(INTEGER, INTEGER) IS 'Retrieves the most recent subscriptions for a user with optional limit.';