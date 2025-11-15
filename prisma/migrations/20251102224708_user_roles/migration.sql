-- TODO NAPISAC FUNKCJE DO CONTEXTUAL ACL 
-- !⚙️ 7. Funkcje — Contextual ACL (opcjonalnie, ale kluczowe np. dla moderatorów streamerów)
-- Assign_role_to_user_in_context(p_user_id, p_role_id, p_context_type, p_context_id)	Przypisuje rolę w kontekście (np. moderator dla streamera)	🆕 do dodania

DROP FUNCTION IF EXISTS Assign_role_to_user_in_context_by_role_id(INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION Assign_role_to_user_in_context_by_role_id(p_user_id INTEGER, p_role_id INTEGER, p_context_id INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  rows INT;
BEGIN
  INSERT INTO user_roles (user_id, role_id, streamer_id)
  VALUES (p_user_id, p_role_id, p_context_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS rows = ROW_COUNT;
  RETURN rows > 0;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Assign_role_to_user_in_context_by_role_name(INTEGER, TEXT);
CREATE OR REPLACE FUNCTION Assign_role_to_user_in_context_by_role_name(
    p_user_id INTEGER,
    p_role_name TEXT,
    p_context_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    rows INT;
    fetched_role_id INTEGER;
BEGIN
    -- Pobranie ID roli na podstawie nazwy
    SELECT role_id
    INTO fetched_role_id
    FROM Get_role_by_name(p_role_name)
    LIMIT 1;

    -- Jeśli nie znaleziono roli, zwróć FALSE
    IF fetched_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Przypisanie roli użytkownikowi
    INSERT INTO user_roles (user_id, role_id, streamer_id)
    VALUES (p_user_id, fetched_role_id, p_context_id)
    ON CONFLICT DO NOTHING;

    -- Sprawdzenie, czy coś wstawiono
    GET DIAGNOSTICS rows = ROW_COUNT;
    RETURN rows > 0;
END;
$$ LANGUAGE plpgsql;


-- Revoke_role_from_user_in_context(p_user_id, p_role_id, p_context_type, p_context_id)	Usuwa przypisanie w kontekście	🆕 do dodania
DROP FUNCTION IF EXISTS Revoke_role_from_user_in_context_by_role_id(INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION Revoke_role_from_user_in_context_by_role_id(p_user_id INTEGER, p_role_id INTEGER, p_context_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_roles
  WHERE user_id = p_user_id AND role_id = p_role_id AND streamer_id = p_context_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get_roles_by_user_in_context(p_user_id, p_context_type, p_context_id)	Zwraca role użytkownika w danym kontekście	🆕 do dodania

DROP FUNCTION IF EXISTS Get_roles_by_user_in_context(p_user_id INTEGER, p_context_id INTEGER);
CREATE OR REPLACE FUNCTION Get_roles_by_user_in_context(p_user_id INTEGER, p_context_id INTEGER)
RETURNS SETOF roles AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM roles r
  JOIN user_roles ur ON r.role_id = ur.role_id
  WHERE ur.user_id = p_user_id AND ur.streamer_id = p_context_id;
END;
$$ LANGUAGE plpgsql;

-- User_has_permission_in_context(p_user_id, p_permission_name, p_context_type, p_context_id)	Sprawdza uprawnienia w kontekście

DROP FUNCTION IF EXISTS User_has_permission_in_context(p_user_id INTEGER, p_permission_name TEXT, p_context_id INTEGER);
CREATE OR REPLACE FUNCTION User_has_permission_in_context(p_user_id INTEGER, p_permission_name TEXT, p_context_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id AND p.name = p_permission_name AND ur.streamer_id = p_context_id;
    RETURN count > 0;
END;
$$ LANGUAGE plpgsql;


--! ⚙️ 5. Funkcje — User ↔ Role Management (nowe)
-- Assign_role_to_user(p_user_id, p_role_id)	Przypisuje rolę użytkownikowi	🆕 do dodania
DROP FUNCTION IF EXISTS Assign_role_to_user_by_role_id(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION Assign_role_to_user_by_role_id(p_user_id INTEGER, p_role_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows INT;
BEGIN
    RETURN Assign_role_to_user_in_context_by_role_id(p_user_id, p_role_id);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Assign_role_to_user_by_role_name(INTEGER, TEXT);
CREATE OR REPLACE FUNCTION Assign_role_to_user_by_role_name(
    p_user_id INTEGER,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    rows INT;
    fetched_role_id INTEGER;
BEGIN
    RETURN Assign_role_to_user_context_by_role_name(p_user_id, p_role_name);
END;
$$ LANGUAGE plpgsql;


-- Revoke_role_from_user(p_user_id, p_role_id)	Usuwa rolę użytkownika	🆕 do dodania

DROP FUNCTION IF EXISTS Revoke_role_from_user_by_role_id(p_user_id INTEGER, p_role_id INTEGER);
CREATE OR REPLACE FUNCTION Revoke_role_from_user_by_role_id(p_user_id INTEGER, p_role_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM user_roles
  WHERE user_id = p_user_id AND role_id = p_role_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS Revoke_role_from_user_by_role_name(INTEGER, TEXT);
CREATE OR REPLACE FUNCTION Revoke_role_from_user_by_role_name(
    p_user_id INTEGER,
    p_role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    fetched_role_id INTEGER;
    result BOOLEAN;
BEGIN
    -- Pobranie ID roli na podstawie nazwy
    SELECT role_id
    INTO fetched_role_id
    FROM Get_role_by_name(p_role_name)
    LIMIT 1;

    -- Jeśli nie znaleziono roli, zwróć FALSE
    IF fetched_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Wywołanie funkcji usuwającej rolę po ID
    SELECT Revoke_role_from_user_by_role_id(p_user_id, fetched_role_id)
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- Get_roles_by_user(p_user_id)	Pobiera wszystkie role użytkownika	🆕 do dodania
DROP FUNCTION IF EXISTS Get_roles_by_user(p_user_id INTEGER);
CREATE OR REPLACE FUNCTION Get_roles_by_user(p_user_id INTEGER)
RETURNS SETOF roles AS $$
BEGIN
  RETURN QUERY
  SELECT r.*
  FROM roles r
  JOIN user_roles ur ON r.role_id = ur.role_id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;



-- ! ⚙️ 6. Funkcje — User ↔ Permission (pośrednio przez role)
-- Get_permissions_by_user(p_user_id)	Pobiera wszystkie uprawnienia użytkownika przez jego role	🆕 do dodania

DROP FUNCTION IF EXISTS Get_permissions_by_user(p_user_id INTEGER);
CREATE OR REPLACE FUNCTION Get_permissions_by_user(p_user_id INTEGER)
RETURNS SETOF permissions AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.*
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- User_has_permission(p_user_id, p_permission_name)	Sprawdza, czy użytkownik ma dane uprawnienie	🆕 do dodania

DROP FUNCTION IF EXISTS User_has_permission(p_user_id INTEGER, p_permission_name TEXT);
CREATE OR REPLACE FUNCTION User_has_permission(p_user_id INTEGER, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id AND p.name = p_permission_name;
    RETURN count > 0;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS User_has_permission_by_permission_id(p_user_id INTEGER, p_permission_id INTEGER);
CREATE OR REPLACE FUNCTION User_has_permission_by_permission_id(p_user_id INTEGER, p_permission_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id AND p.permission_id = p_permission_id;
    RETURN count > 0;
END;
$$ LANGUAGE plpgsql;