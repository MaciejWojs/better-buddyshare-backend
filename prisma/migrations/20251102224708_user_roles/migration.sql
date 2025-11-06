-- !️ 7. Functions — Contextual ACL (optional but crucial e.g. for streamer moderators)
-- Assign_role_to_user_in_context(p_user_id, p_role_id, p_context_type, p_context_id)	Assigns a role within a context (e.g., streamer moderator) — to be added

DROP FUNCTION IF EXISTS Assign_role_to_user_in_context_by_role_id(INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION Assign_role_to_user_in_context_by_role_id(
  p_user_id INTEGER,
  p_role_id INTEGER,
  p_context_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  exists_already BOOLEAN;
BEGIN
  -- Check if record already exists (special condition for NULL streamer_id)
  IF p_context_id IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = p_user_id
        AND role_id = p_role_id
        AND streamer_id IS NULL
    ) INTO exists_already;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = p_user_id
        AND role_id = p_role_id
        AND streamer_id = p_context_id
    ) INTO exists_already;
  END IF;

  -- If doesn't exist, insert new record
  IF NOT exists_already THEN
    INSERT INTO user_roles (user_id, role_id, streamer_id)
    VALUES (p_user_id, p_role_id, p_context_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Always returns TRUE (role is assigned)
  RETURN TRUE;
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
    -- Fetch role ID based on name
    SELECT role_id
    INTO fetched_role_id
    FROM Get_role_by_name(p_role_name)
    LIMIT 1;

    -- If role not found, return FALSE
    IF fetched_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN Assign_role_to_user_in_context_by_role_id(p_user_id, fetched_role_id, p_context_id);
END;
$$ LANGUAGE plpgsql;


-- Revoke_role_from_user_in_context(p_user_id, p_role_id, p_context_type, p_context_id)	Removes assignment within a context — to be added
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

-- Remove user's role in a context by role name
DROP FUNCTION IF EXISTS Revoke_role_from_user_in_context_by_role_name(INTEGER, TEXT, INTEGER);
CREATE OR REPLACE FUNCTION Revoke_role_from_user_in_context_by_role_name(
  p_user_id INTEGER,
  p_role_name TEXT,
  p_context_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  fetched_role_id INTEGER;
  result BOOLEAN;
BEGIN
  -- Get role ID by name
  SELECT role_id
  INTO fetched_role_id
  FROM Get_role_by_name(p_role_name)
  LIMIT 1;

  -- If not found, return FALSE
  IF fetched_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Call the version that accepts ID
  SELECT Revoke_role_from_user_in_context_by_role_id(p_user_id, fetched_role_id, p_context_id)
  INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;


-- Get_roles_by_user_in_context(p_user_id, p_context_type, p_context_id)	Returns user's roles in a given context — to be added

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

-- User_has_permission_in_context(p_user_id, p_permission_name, p_context_type, p_context_id)	Check permission in a context

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


--! ️ 5. Functions — User ↔ Role Management (new)
-- Assign_role_to_user(p_user_id, p_role_id)	Assigns a role to a user — to be added
DROP FUNCTION IF EXISTS Assign_role_to_user_by_role_id(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION Assign_role_to_user_by_role_id(p_user_id INTEGER, p_role_id INTEGER)
RETURNS BOOLEAN AS $$
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
BEGIN
    RETURN Assign_role_to_user_in_context_by_role_name(p_user_id, p_role_name);
END;
$$ LANGUAGE plpgsql;

-- Revoke_role_from_user(p_user_id, p_role_id)	Removes a role from a user — to be added

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
    -- Fetch role ID based on name
    SELECT role_id
    INTO fetched_role_id
    FROM Get_role_by_name(p_role_name)
    LIMIT 1;

    -- If role not found, return FALSE
    IF fetched_role_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Call function that removes role by ID
    SELECT Revoke_role_from_user_by_role_id(p_user_id, fetched_role_id)
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;


-- Get_roles_by_user(p_user_id)	Fetches all roles of a user — to be added
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



-- !️ 6. Functions — User ↔ Permission (indirectly via roles)
-- Get_permissions_by_user(p_user_id)	Gets all permissions of a user through their roles — to be added

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

-- User_has_permission(p_user_id, p_permission_name)	Checks whether a user has a given permission — to be added

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

DROP FUNCTION IF EXISTS User_has_permission_by_permission_id_in_context(p_user_id INTEGER, p_permission_id INTEGER, p_context_id INTEGER);
CREATE OR REPLACE FUNCTION User_has_permission_by_permission_id_in_context(p_user_id INTEGER, p_permission_id INTEGER, p_context_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    count INT;
BEGIN
    SELECT COUNT(*) INTO count
    FROM permissions p
    JOIN role_permissions rp ON p.permission_id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id AND p.permission_id = p_permission_id AND ur.streamer_id = p_context_id;
    RETURN count > 0;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS User_has_permission_by_permission_name_in_context(p_user_id INTEGER, p_permission_name TEXT, p_context_id INTEGER);
CREATE OR REPLACE FUNCTION User_has_permission_by_permission_name_in_context(p_user_id INTEGER, p_permission_name TEXT, p_context_id INTEGER)
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