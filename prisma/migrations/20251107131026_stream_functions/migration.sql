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
