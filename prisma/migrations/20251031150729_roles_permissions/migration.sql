-- ! ROLE MANAGEMENT
DROP FUNCTION IF EXISTS Create_role(p_name TEXT) CASCADE;

CREATE OR REPLACE FUNCTION Create_role(p_name TEXT)
RETURNS SETOF roles AS $$
BEGIN
  INSERT INTO roles (name)
  VALUES (p_name);
    RETURN QUERY SELECT * FROM roles WHERE name = p_name;
END;
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS Delete_role_by_id(p_role_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Delete_role_by_id(p_role_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM roles WHERE role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_role_by_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Delete_role_by_name(p_name TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM roles WHERE name = p_name;
END;
$$ LANGUAGE plpgsql;

-- ! ROLE AND PERMISSION ASSIGNMENT MANAGEMENT

DROP FUNCTION IF EXISTS Assign_permission_to_role(p_role_id INTEGER, p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Assign_permission_to_role(p_role_id INTEGER, p_permission_id INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES (p_role_id, p_permission_id);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Revoke_permission_from_role(p_role_id INTEGER, p_permission_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Revoke_permission_from_role(p_role_id INTEGER, p_permission_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM role_permissions
  WHERE role_id = p_role_id AND permission_id = p_permission_id;
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
  INSERT INTO permissions (name)
  VALUES (p_name);
    RETURN QUERY SELECT * FROM permissions WHERE name = p_name;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_role_by_id(p_role_id INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION Delete_role_by_id(p_role_id INTEGER)
RETURNS VOID AS $$
BEGIN
  DELETE FROM roles WHERE role_id = p_role_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS Delete_permission_by_name(p_name TEXT) CASCADE;
CREATE OR REPLACE FUNCTION Delete_permission_by_name(p_name TEXT)
RETURNS VOID AS $$
BEGIN
  DELETE FROM permissions WHERE name = p_name;
END;
$$ LANGUAGE plpgsql;