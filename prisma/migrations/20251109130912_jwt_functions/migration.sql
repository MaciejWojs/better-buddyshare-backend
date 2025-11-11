ALTER TABLE refresh_tokens ALTER COLUMN token_id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE sessions ALTER COLUMN session_id SET DEFAULT gen_random_uuid()::text;

-- 1. Unique index on token_hash in refresh_tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
ON refresh_tokens (token_hash);

-- 2. Regular index on session_id in refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id
ON refresh_tokens (session_id);

-- 3. Regular index on user_id in sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
ON sessions (user_id);

CREATE OR REPLACE FUNCTION generate_token_hash(p_raw_token text)
RETURNS text AS $$
DECLARE
    pepper text := current_setting('security.jwt_pepper', true);
BEGIN
    IF p_raw_token IS NULL OR length(p_raw_token) = 0 THEN
        RAISE EXCEPTION 'Token cannot be empty';
    END IF;

    RETURN encode(digest(p_raw_token || coalesce(pepper, ''), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql STABLE STRICT;


--! Transakcje

--! Rotacja tokena + unieważnianie starego → w jednej transakcji (atomiczne i odporne na race conditions)

-- create_session(user_id int, ip_address text, user_agent text, device_info text, expires_at timestamp) 
--   -> tworzy session, zwraca session_id (TEXT)

DROP FUNCTION IF EXISTS create_session(INTEGER, TIMESTAMP, TEXT, TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION create_session(
    p_user_id INTEGER,
    p_expires_at TIMESTAMP,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL
)
RETURNS SETOF sessions AS $$
BEGIN
    -- zwracamy wynik INSERT przez RETURN QUERY
    RETURN QUERY
    INSERT INTO sessions (session_id, user_id, ip_address, user_agent, device_info, expires_at)
    VALUES (gen_random_uuid()::text, p_user_id, p_ip_address, p_user_agent, p_device_info, p_expires_at)
    RETURNING *;
END;
$$ LANGUAGE plpgsql;


-- issue_refresh_token(session_id TEXT, user_id int, expires_at timestamp, raw_token text)
--   -> zapisuje token_hash (pgcrypto), zwraca rekord refresh_tokens
DROP FUNCTION IF EXISTS issue_refresh_token(TEXT, INTEGER, TIMESTAMP, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION issue_refresh_token(
    p_session_id TEXT,
    p_user_id INTEGER,
    p_expires_at TIMESTAMP,
    p_raw_token TEXT
)
RETURNS refresh_tokens AS $$
DECLARE
    new_token refresh_tokens%ROWTYPE;
    token_hash TEXT;
BEGIN
    token_hash := generate_token_hash(p_raw_token);
    INSERT INTO refresh_tokens (token_id, token_hash, user_id, session_id, expires_at)
    VALUES (gen_random_uuid()::text,  token_hash, p_user_id, p_session_id, p_expires_at)
    RETURNING * INTO new_token;
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;


-- rotate_refresh_token(old_token_hash text, new_expires_at timestamp, new_raw_token text)
--   -> atomowo oznacza stary token jako replaced/revoked, tworzy nowy token i powiązanie replaced_by_id

DROP FUNCTION IF EXISTS rotate_refresh_token(TEXT, TIMESTAMP, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION rotate_refresh_token(
    p_old_token_hash TEXT,
    p_new_expires_at TIMESTAMP,
    p_new_raw_token TEXT
)
RETURNS refresh_tokens AS $$
DECLARE
    old_token refresh_tokens%ROWTYPE;
    new_token refresh_tokens%ROWTYPE;
    new_token_hash TEXT;
BEGIN
    -- 1. Pobierz i zablokuj stary token (FOR UPDATE)
    SELECT * INTO old_token
    FROM refresh_tokens
    WHERE token_hash = p_old_token_hash
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Old token not found';
    END IF;
    -- 2. Oznacz stary token jako revoked i ustaw replaced_by_id (tymczasowo NULL)
    UPDATE refresh_tokens
    SET revoked_at = NOW(), replaced_by_id = NULL
    WHERE token_hash = p_old_token_hash;
    -- 3. Wygeneruj hash dla nowego tokena
    new_token_hash := generate_token_hash(p_new_raw_token);
    -- 4. Wstaw nowy token
    INSERT INTO refresh_tokens (token_hash, user_id, session_id, expires_at)
    VALUES (new_token_hash, old_token.user_id, old_token.session_id, p_new_expires_at)
    RETURNING * INTO new_token;
    -- 5. Zaktualizuj replaced_by_id w starym tokenie
    UPDATE refresh_tokens
    SET replaced_by_id = new_token.token_id
    WHERE token_hash = p_old_token_hash;
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- is_refresh_token_valid(token_hash text) RETURNS boolean
--   -> sprawdza is_active session, not revoked, not expired, not replaced
DROP FUNCTION IF EXISTS is_refresh_token_valid(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION is_refresh_token_valid(p_token_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    token_record refresh_tokens%ROWTYPE;
    session_record sessions%ROWTYPE;
BEGIN
    SELECT * INTO token_record
    FROM refresh_tokens
    WHERE token_hash = p_token_hash;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF token_record.revoked_at IS NOT NULL OR token_record.expires_at < NOW() OR token_record.replaced_by_id IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    SELECT * INTO session_record
    FROM sessions
    WHERE session_id = token_record.session_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF session_record.is_active = FALSE OR session_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- revoke_refresh_token(token_hash text, revoke_session boolean default false)
--   -> ustawia revoked_at, opcjonalnie unieważnia sesję powiązaną
DROP FUNCTION IF EXISTS revoke_refresh_token(TEXT, BOOLEAN) CASCADE;
CREATE OR REPLACE FUNCTION revoke_refresh_token(p_token_hash TEXT, p_revoke_session BOOLEAN DEFAULT FALSE)
RETURNS BOOLEAN AS $$
DECLARE
    token_record refresh_tokens%ROWTYPE;
    updated_count INTEGER := 0;
BEGIN
    SELECT * INTO token_record
    FROM refresh_tokens
    WHERE token_hash = p_token_hash;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = p_token_hash;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF p_revoke_session THEN
        UPDATE sessions
        SET is_active = FALSE, revoked_at = NOW()
        WHERE session_id = token_record.session_id;
    END IF;
    RETURN (updated_count > 0);
END;
$$ LANGUAGE plpgsql;

-- revoke_session(session_id TEXT)
--   -> ustawia revoked_at i is_active = false dla sesji i unieważnia powiązane tokeny

DROP FUNCTION IF EXISTS revoke_session(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION revoke_session(p_session_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    updated_id TEXT;
BEGIN
    UPDATE sessions
    SET is_active = FALSE, revoked_at = NOW()
    WHERE session_id = p_session_id
    RETURNING session_id INTO updated_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE session_id = p_session_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;



-- revoke_all_user_sessions(user_id int)
--   -> unieważnia wszystkie sesje i tokeny użytkownika
DROP FUNCTION IF EXISTS revoke_all_user_sessions(INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    updated_sessions INTEGER := 0;
    updated_tokens   INTEGER := 0;
BEGIN
    -- Unieważnij sesje użytkownika
    UPDATE sessions
    SET is_active = FALSE, revoked_at = NOW()
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS updated_sessions = ROW_COUNT;

    -- Unieważnij powiązane tokeny
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS updated_tokens = ROW_COUNT;

    RETURN (updated_sessions > 0 OR updated_tokens > 0);
END;
$$ LANGUAGE plpgsql;

-- get_active_sessions(user_id int) RETURNS SETOF sessions
--   -> zwraca aktywne (is_active=true, not expired) sesje użytkownika
DROP FUNCTION IF EXISTS get_active_sessions(INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_active_sessions(p_user_id INTEGER)
RETURNS SETOF sessions AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM sessions
    WHERE user_id = p_user_id AND is_active = TRUE AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- get_refresh_token(token_hash text) RETURNS refresh_tokens
--   -> pobiera rekord refresh_tokens wg hash
DROP FUNCTION IF EXISTS get_refresh_token(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION get_refresh_token(p_token_hash TEXT)
RETURNS refresh_tokens AS $$
DECLARE
    result refresh_tokens%ROWTYPE;
BEGIN
    SELECT * INTO result
    FROM refresh_tokens
    WHERE token_hash = p_token_hash;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- get_refresh_tokens_by_session(session_id TEXT) RETURNS SETOF refresh_tokens
--   -> lista tokenów powiązanych z sesją
DROP FUNCTION IF EXISTS get_refresh_tokens_by_session(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION get_refresh_tokens_by_session(p_session_id TEXT)
RETURNS SETOF refresh_tokens AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM refresh_tokens
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- get_user_token_history(user_id int, limit int default 100) RETURNS SETOF refresh_tokens
--   -> historia tokenów użytkownika (użyte, revoked, replaced)
DROP FUNCTION IF EXISTS get_user_token_history(INTEGER, INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_user_token_history(p_user_id INTEGER, p_limit INTEGER DEFAULT 100)
RETURNS SETOF refresh_tokens AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM refresh_tokens
    WHERE user_id = p_user_id
    ORDER BY issued_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- mark_refresh_token_used(token_hash text)
--   -> ustawia used_at dla tokena (audyt użycia)
DROP FUNCTION IF EXISTS mark_refresh_token_used(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION mark_refresh_token_used(p_token_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE refresh_tokens
    SET used_at = NOW()
    WHERE token_hash = p_token_hash;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN (updated_count > 0);
END;
$$ LANGUAGE plpgsql;

-- replace_refresh_token(old_token_hash text, new_token_id TEXT)
--   -> ustawia replaced_by_id dla old_token
DROP FUNCTION IF EXISTS replace_refresh_token(TEXT, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION replace_refresh_token(p_old_token_hash TEXT, p_new_token_id TEXT)
RETURNS SETOF refresh_tokens AS $$
BEGIN
    RETURN QUERY
    UPDATE refresh_tokens
    SET replaced_by_id = p_new_token_id
    WHERE token_hash = p_old_token_hash
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- cleanup_expired_sessions_tokens()
DROP FUNCTION IF EXISTS cleanup_expired_sessions_tokens() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_expired_sessions_tokens()
RETURNS BOOLEAN AS $$
DECLARE
    updated_sessions INTEGER := 0;
    updated_tokens   INTEGER := 0;
BEGIN
    UPDATE sessions
    SET is_active = FALSE, revoked_at = NOW()
    WHERE expires_at < NOW() AND is_active = TRUE;
    GET DIAGNOSTICS updated_sessions = ROW_COUNT;

    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE expires_at < NOW() AND revoked_at IS NULL;
    GET DIAGNOSTICS updated_tokens = ROW_COUNT;

    RETURN (updated_sessions > 0 OR updated_tokens > 0);
END;
$$ LANGUAGE plpgsql;


-- cleanup_revoked_tokens_older_than(p_days int)
--   -> usuwa/redukuje rekordy tokenów z revoked_at starsze niż p_days (pruning)

DROP FUNCTION IF EXISTS cleanup_revoked_tokens_older_than(INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION cleanup_revoked_tokens_older_than(p_days INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM refresh_tokens
    WHERE revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '1 day' * p_days;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN (deleted_count > 0);
END;
$$ LANGUAGE plpgsql;

-- extend_session_expiry(session_id TEXT, new_expires_at timestamp)
--   -> przedłuża expires_at sesji
DROP FUNCTION IF EXISTS extend_session_expiry(TEXT, TIMESTAMP) CASCADE;
CREATE OR REPLACE FUNCTION extend_session_expiry(p_session_id TEXT, p_new_expires_at TIMESTAMP)
RETURNS SETOF sessions AS $$
BEGIN
    RETURN QUERY
    UPDATE sessions
    SET expires_at = p_new_expires_at
    WHERE session_id = p_session_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- touch_session_last_used(session_id TEXT)
--   -> aktualizuje last_used_at na now() (używane przy refresh token flow)
DROP FUNCTION IF EXISTS touch_session_last_used(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION touch_session_last_used(p_session_id TEXT)
RETURNS SETOF sessions AS $$
BEGIN
    RETURN QUERY
    UPDATE sessions
    SET last_used_at = NOW()
    WHERE session_id = p_session_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- get_sessions_with_refresh_tokens(user_id int) RETURNS SETOF RECORD
--   -> pomocnicze: sesje razem z liczbą/ostatnim tokenem, przydatne do UI zarządzania sesjami
DROP FUNCTION IF EXISTS get_sessions_with_refresh_tokens(INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_sessions_with_refresh_tokens(p_user_id INTEGER)
RETURNS TABLE (
    session_id TEXT,
    last_token_issued_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.session_id, MAX(rt.expires_at) AS last_token_issued_at
    FROM sessions s
    LEFT JOIN refresh_tokens rt ON rt.session_id = s.session_id
    WHERE s.user_id = p_user_id
    GROUP BY s.session_id;
END;
$$ LANGUAGE plpgsql;

-- revoke_tokens_by_session(session_id TEXT)
--   -> unieważnia wszystkie tokeny powiązane z daną sesją
DROP FUNCTION IF EXISTS revoke_tokens_by_session(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION revoke_tokens_by_session(p_session_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE session_id = p_session_id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN (updated_count > 0);
END;
$$ LANGUAGE plpgsql;

-- rotate_and_return_raw_token(old_token_hash text, new_expires_at timestamp)
--   -> (opcjonalne) wykonuje rotację i zwraca raw token do wysłania klientowi (jeśli generujemy raw token w DB)
DROP FUNCTION IF EXISTS rotate_and_return_raw_token(TEXT, TIMESTAMP) CASCADE;
CREATE OR REPLACE FUNCTION rotate_and_return_raw_token(
    p_old_token_hash TEXT,
    p_new_expires_at TIMESTAMP
)
RETURNS TEXT AS $$
DECLARE
    old_token refresh_tokens%ROWTYPE;
    new_token refresh_tokens%ROWTYPE;
    new_raw_token TEXT;
    new_token_hash TEXT;
BEGIN
    -- 1. Pobierz i zablokuj stary token
    SELECT * INTO old_token
    FROM refresh_tokens
    WHERE token_hash = p_old_token_hash
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Old token not found';
    END IF;
    -- 2. Oznacz stary token jako revoked i ustaw replaced_by_id (tymczasowo NULL)
    UPDATE refresh_tokens
    SET revoked_at = NOW(), replaced_by_id = NULL
    WHERE token_hash = p_old_token_hash;
    -- 3. Wygeneruj nowy raw token
    new_raw_token := encode(gen_random_bytes(32), 'hex');
    -- 4. Wygeneruj hash dla nowego tokena
    new_token_hash := generate_token_hash(new_raw_token);
    -- 5. Wstaw nowy token
    INSERT INTO refresh_tokens (token_hash, user_id, session_id, expires_at)
    VALUES (new_token_hash, old_token.user_id, old_token.session_id, p_new_expires_at)
    RETURNING * INTO new_token;
    -- 6. Zaktualizuj replaced_by_id w starym tokenie
    UPDATE refresh_tokens
    SET replaced_by_id = new_token.token_id
    WHERE token_hash = p_old_token_hash;
    RETURN new_raw_token;
END;
$$ LANGUAGE plpgsql;

-- is_token_hash_unique(token_hash text) RETURNS boolean
--   -> walidacja unikalności przed wstawieniem (opcjonalne, indeks już istnieje)

DROP FUNCTION IF EXISTS is_token_hash_unique(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION is_token_hash_unique(p_token_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM refresh_tokens
    WHERE token_hash = p_token_hash;
    RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql;