-- ! ROLE MANAGEMENT
DROP FUNCTION IF EXISTS Create_role(p_name TEXT) CASCADE;

CREATE OR REPLACE FUNCTION Create_role(p_name TEXT)
RETURNS SETOF roles AS $$
BEGIN

  RETURN QUERY SELECT * FROM roles WHERE name = p_name; 

  IF NOT FOUND THEN
    RETURN QUERY INSERT INTO roles (name) VALUES (p_name) RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS Delete_role_by_id(p_role_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Delete_role_by_id(p_role_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM roles WHERE role_id = p_role_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_role_by_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Delete_role_by_name(p_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM roles WHERE "name" = p_name;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_all_roles() CASCADE;
CREATE OR REPLACE FUNCTION Get_all_roles()
RETURNS SETOF roles AS $$
BEGIN
  RETURN QUERY SELECT * FROM roles;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_role_by_id(p_role_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Get_role_by_id(p_role_id INTEGER)
RETURNS SETOF roles AS $$
BEGIN
  RETURN QUERY SELECT * FROM roles WHERE role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_role_by_name(p_role_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Get_role_by_name(p_role_name TEXT)
RETURNS SETOF roles AS $$
BEGIN
  RETURN QUERY SELECT * FROM roles WHERE "name" = p_role_name;
END;
$$ LANGUAGE plpgsql;

-- ! ROLE AND PERMISSION ASSIGNMENT MANAGEMENT

DROP FUNCTION IF EXISTS Assign_permission_to_role(p_role_id INTEGER, p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Assign_permission_to_role(p_role_id INTEGER, p_permission_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows INT;
BEGIN
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES (p_role_id, p_permission_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS rows = ROW_COUNT;
  RETURN rows > 0;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Revoke_permission_from_role(p_role_id INTEGER, p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Revoke_permission_from_role(p_role_id INTEGER, p_permission_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM role_permissions
  WHERE role_id = p_role_id AND permission_id = p_permission_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_permissions_by_role_id(p_role_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION get_permissions_by_role_id(p_role_id INTEGER)
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY
  SELECT perm.*
  FROM permissions perm
  JOIN role_permissions rp ON perm.permission_id = rp.permission_id
  WHERE rp.role_id = p_role_id; 
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_permissions_by_role_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION get_permissions_by_role_name(p_name TEXT)
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY
  SELECT perm.*
  FROM permissions perm
  JOIN role_permissions rp ON perm.permission_id = rp.permission_id
  JOIN roles r ON rp.role_id = r.role_id
  WHERE r.name = p_name;
END;
$$ LANGUAGE plpgsql;

-- ! PERMISSIONS MANAGEMENT

DROP FUNCTION IF EXISTS Create_permission(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Create_permission(p_name TEXT)
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY SELECT * FROM permissions WHERE name = p_name; 

  IF NOT FOUND THEN
    RETURN QUERY INSERT INTO permissions (name) VALUES (p_name) RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_permission_by_id(p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Delete_permission_by_id(p_permission_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM permissions WHERE permission_id = p_permission_id;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_permission_by_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Delete_permission_by_name(p_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM permissions WHERE "name" = p_name;
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_all_permissions() CASCADE;
CREATE OR REPLACE FUNCTION Get_all_permissions()
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY SELECT * FROM permissions;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_permission_by_id(p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Get_permission_by_id(p_permission_id INTEGER)
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY SELECT * FROM permissions WHERE permission_id = p_permission_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Get_permission_by_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Get_permission_by_name(p_name TEXT)
RETURNS SETOF permissions AS $$
BEGIN
  RETURN QUERY SELECT * FROM permissions WHERE "name" = p_name;
END;
$$ LANGUAGE plpgsql;