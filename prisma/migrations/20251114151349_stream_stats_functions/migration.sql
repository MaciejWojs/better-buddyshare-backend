-- =============================================================================
-- STREAM STATISTICS TYPE MANAGEMENT FUNCTIONS
-- =============================================================================
CREATE
OR REPLACE FUNCTION statistic_type_exists_by_id(p_stream_statistic_type_id INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    type_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM stream_statistics_types
        WHERE stream_statistic_type_id = p_stream_statistic_type_id
    )
    INTO type_exists;

    RETURN type_exists;
END;
$$;

COMMENT
  ON FUNCTION statistic_type_exists_by_id(INTEGER) IS 'Checks if a stream statistic type with the given ID exists. Returns TRUE if exists, FALSE otherwise.';

-- Create a new stream statistic type
CREATE
OR REPLACE FUNCTION create_statistic_type(p_name TEXT, p_description TEXT DEFAULT NULL) RETURNS stream_statistics_types LANGUAGE plpgsql AS $$
DECLARE
    existing_row stream_statistics_types;
BEGIN
    -- Try to fetch an existing row
    SELECT *
    INTO existing_row
    FROM stream_statistics_types
    WHERE name = p_name;

    -- Return the existing row if found
    IF FOUND THEN
        RETURN existing_row;
    END IF;

    -- Otherwise insert a new row and return it
    INSERT INTO stream_statistics_types (name, description)
    VALUES (p_name, p_description)
    RETURNING *
    INTO existing_row;

    RETURN existing_row;
END;
$$;

COMMENT
  ON FUNCTION create_statistic_type(TEXT, TEXT) IS 'Creates a new stream statistic type with the given name and optional description. Returns the newly created statistic type. If a type with the same name already exists, returns the existing type.';

-- Update an existing stream statistic type
CREATE
OR REPLACE FUNCTION update_statistic_type(
  p_stream_statistic_type_id INTEGER,
  p_name TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS stream_statistics_types LANGUAGE plpgsql AS $$
DECLARE
updated_row stream_statistics_types;
BEGIN
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'NO_DATA_FOUND',
                  HINT = 'Check the provided ID.';
    END IF;

    UPDATE stream_statistics_types
    SET
      name = p_name,
      description = p_description
    WHERE stream_statistic_type_id = p_stream_statistic_type_id
    RETURNING * INTO updated_row;

    RETURN updated_row;
END;
$$;

COMMENT
  ON FUNCTION update_statistic_type(INTEGER, TEXT, TEXT) IS 'Updates an existing stream statistic type by ID. Returns the updated statistic type. Raises an exception if the type does not exist.';

-- Delete a stream statistic type
CREATE
OR REPLACE FUNCTION delete_statistic_type(p_stream_statistic_type_id INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE 
    deleted_count INTEGER;
BEGIN
   Delete FROM stream_statistics_types
   WHERE stream_statistic_type_id = p_stream_statistic_type_id;
   get diagnostics deleted_count = ROW_COUNT;
    RETURN deleted_count = 1;   
END;
$$;

COMMENT
  ON FUNCTION delete_statistic_type(INTEGER) IS 'Deletes a stream statistic type by ID. This will also cascade delete all related stream statistics. Returns TRUE if the deletion was successful, FALSE otherwise.';

-- Get all stream statistic types
CREATE
OR REPLACE FUNCTION get_all_statistic_types() RETURNS SETOF "stream_statistics_types" LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM "stream_statistics_types"
    ORDER BY name;
END;
$$;

COMMENT
  ON FUNCTION get_all_statistic_types() IS 'Retrieves all stream statistic types ordered by name.';

-- Get a specific stream statistic type by ID
CREATE
OR REPLACE FUNCTION get_statistic_type_by_id(p_stream_statistic_type_id INTEGER) RETURNS SETOF "stream_statistics_types" LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM "stream_statistics_types"
    WHERE stream_statistic_type_id = p_stream_statistic_type_id;
END;
$$;

COMMENT
  ON FUNCTION get_statistic_type_by_id(INTEGER) IS 'Retrieves a specific stream statistic type by ID.';

-- =============================================================================
-- STREAM STATISTICS MANAGEMENT FUNCTIONS
-- =============================================================================

-- Add a new stream statistic entry
CREATE OR REPLACE FUNCTION add_stream_statistic(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER,
  p_value INTEGER,
  p_timepoint TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
) RETURNS stream_statistics_in_time LANGUAGE plpgsql AS $$
DECLARE
    new_row stream_statistics_in_time%ROWTYPE;
BEGIN
    -- Validate stream existence
    IF NOT check_if_stream_exists(p_stream_id)
    THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type existence
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id)
    THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    INSERT INTO stream_statistics_in_time (
        stream_id,
        stream_statistic_type_id,
        value,
        timepoint
    ) VALUES (
        p_stream_id,
        p_stream_statistic_type_id,
        p_value,
        p_timepoint
    ) RETURNING * INTO new_row;

    RETURN new_row;
END;
$$;

COMMENT
  ON FUNCTION add_stream_statistic(INTEGER, INTEGER, INTEGER, TIMESTAMP) IS 'Adds a new stream statistic entry for the specified stream and statistic type. Returns the newly created statistic entry.';

-- Update an existing stream statistic entry
CREATE OR REPLACE FUNCTION update_stream_statistic_value(
    p_statistic_in_time_id INTEGER,
    p_value INTEGER
)
RETURNS stream_statistics_in_time
LANGUAGE plpgsql
AS $$
DECLARE
    updated_row stream_statistics_in_time%ROWTYPE;
BEGIN
    -- Update the row
    UPDATE stream_statistics_in_time
    SET value = p_value
    WHERE statistic_in_time_id = p_statistic_in_time_id
    RETURNING *
    INTO updated_row;

    -- If no row was updated, raise an exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stream statistic entry with ID % does not exist.',
            p_statistic_in_time_id
            USING ERRCODE = 'NO_DATA_FOUND';
    END IF;

    RETURN updated_row;
END;
$$;

COMMENT ON FUNCTION update_stream_statistic_value(INTEGER, INTEGER)
    IS 'Updates an existing stream statistic entry by ID. Returns the updated statistic entry. Raises an exception if the entry does not exist.';

-- Delete a specific stream statistic entry
CREATE
OR REPLACE FUNCTION delete_stream_statistic(p_statistic_in_time_id INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    Delete FROM stream_statistics_in_time
    WHERE statistic_in_time_id = p_statistic_in_time_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count = 1;
END;
$$;

COMMENT
  ON FUNCTION delete_stream_statistic(INTEGER) IS 'Deletes a specific stream statistic entry by ID. Returns TRUE if the deletion was successful, FALSE otherwise.';

-- Delete all statistics for a specific stream
CREATE
OR REPLACE FUNCTION delete_statistics_for_stream(p_stream_id INTEGER) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM stream_statistics_in_time
    WHERE stream_id = p_stream_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT
  ON FUNCTION delete_statistics_for_stream(INTEGER) IS 'Deletes all statistic entries for a specific stream. Returns the number of deleted entries.';

-- Delete all statistics for a specific statistic type
CREATE
OR REPLACE FUNCTION delete_statistics_for_type(p_stream_statistic_type_id INTEGER) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM stream_statistics_in_time
    WHERE stream_statistic_type_id = p_stream_statistic_type_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT
  ON FUNCTION delete_statistics_for_type(INTEGER) IS 'Deletes all statistic entries for a specific statistic type across all streams. Returns the number of deleted entries.';

-- Get statistics for a specific stream, including type info
CREATE
OR REPLACE FUNCTION get_statistics_for_stream(
  p_stream_id INTEGER,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  statistic_in_time_id INTEGER,
  stream_id INTEGER,
  stream_statistic_type_id INTEGER,
  statistic_type_name TEXT,
  statistic_type_description TEXT,
  value INTEGER,
  timepoint TIMESTAMP(3)
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream existence
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Return statistics joined with type info
    RETURN QUERY
    SELECT 
        s.statistic_in_time_id,
        s.stream_id,
        s.stream_statistic_type_id,
        t.name AS statistic_type_name,
        t.description AS statistic_type_description,
        s.value,
        s.timepoint
    FROM stream_statistics_in_time s
    JOIN stream_statistics_types t
      ON s.stream_statistic_type_id = t.stream_statistic_type_id
    WHERE s.stream_id = p_stream_id
    ORDER BY s.timepoint DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMENT
  ON FUNCTION get_statistics_for_stream(INTEGER, INTEGER, INTEGER) IS 'Retrieves all statistic entries for a specific stream, including type name and description, ordered by timepoint descending. Supports pagination with limit and offset parameters.';

-- Get statistics for a specific stream and statistic type, including type info
CREATE
OR REPLACE FUNCTION get_statistics_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  statistic_in_time_id INTEGER,
  stream_id INTEGER,
  stream_statistic_type_id INTEGER,
  statistic_type_name TEXT,
  statistic_type_description TEXT,
  value INTEGER,
  timepoint TIMESTAMP(3)
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream existence
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type existence
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Return statistics joined with type info
    RETURN QUERY
    SELECT 
        s.statistic_in_time_id,
        s.stream_id,
        s.stream_statistic_type_id,
        t.name AS statistic_type_name,
        t.description AS statistic_type_description,
        s.value,
        s.timepoint
    FROM stream_statistics_in_time s
    JOIN stream_statistics_types t
      ON s.stream_statistic_type_id = t.stream_statistic_type_id
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
    ORDER BY s.timepoint DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMENT
  ON FUNCTION get_statistics_for_stream_and_type(INTEGER, INTEGER, INTEGER, INTEGER) IS 'Retrieves statistic entries for a specific stream and statistic type, including type name and description, ordered by timepoint descending. Supports pagination with limit and offset.';

-- Get statistics by date range for a specific stream
CREATE
OR REPLACE FUNCTION get_statistics_for_stream_by_date_range(
  p_stream_id INTEGER,
  p_start_date TIMESTAMP(3),
  p_end_date TIMESTAMP(3),
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  statistic_in_time_id INTEGER,
  stream_id INTEGER,
  stream_statistic_type_id INTEGER,
  statistic_type_name TEXT,
  statistic_type_description TEXT,
  value INTEGER,
  timepoint TIMESTAMP(3)
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream existence
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Return statistics joined with type info and filtered by date range
    RETURN QUERY
    SELECT 
        s.statistic_in_time_id,
        s.stream_id,
        s.stream_statistic_type_id,
        t.name AS statistic_type_name,
        t.description AS statistic_type_description,
        s.value,
        s.timepoint
    FROM stream_statistics_in_time s
    JOIN stream_statistics_types t
      ON s.stream_statistic_type_id = t.stream_statistic_type_id
    WHERE s.stream_id = p_stream_id
      AND s.timepoint >= p_start_date
      AND s.timepoint <= p_end_date
    ORDER BY s.timepoint DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

COMMENT
  ON FUNCTION get_statistics_for_stream_by_date_range(INTEGER, TIMESTAMP, TIMESTAMP, INTEGER, INTEGER) IS 'Retrieves statistic entries for a specific stream within a date range, including type name and description, ordered by timepoint descending. Supports pagination with limit and offset parameters.';

-- =============================================================================
-- ADVANCED STREAM STATISTICS TYPE MANAGEMENT FUNCTIONS
-- =============================================================================
-- Check if statistic type exists by name
CREATE
OR REPLACE FUNCTION statistic_type_exists_by_name(p_name TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM stream_statistics_types
        WHERE name = p_name
    );
END;
$$;

COMMENT
  ON FUNCTION statistic_type_exists_by_name(TEXT) IS 'Checks if a stream statistic type with the given name exists. Returns TRUE if exists, FALSE otherwise.';

-- Get statistic type by name
CREATE
OR REPLACE FUNCTION get_statistic_type_by_name(p_name TEXT) RETURNS stream_statistics_types LANGUAGE plpgsql AS $$
DECLARE
    result_row stream_statistics_types%ROWTYPE;
BEGIN
    -- Sprawdzenie, czy typ statystyki istnieje
    IF NOT statistic_type_exists_by_name(p_name) THEN
        RAISE EXCEPTION 'Stream statistic type with name % does not exist.', p_name
            USING ERRCODE = 'NO_DATA_FOUND';
    END IF;

    -- Pobranie wiersza
    SELECT *
    INTO result_row
    FROM stream_statistics_types
    WHERE name = p_name;

    RETURN result_row;
END;
$$;

COMMENT
  ON FUNCTION get_statistic_type_by_name(TEXT) IS 'Retrieves a stream statistic type by its exact name.';

-- Count total statistic types
CREATE
OR REPLACE FUNCTION count_statistic_types() RETURNS INTEGER LANGUAGE plpgsql AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM stream_statistics_types);
END;
$$;

COMMENT
  ON FUNCTION count_statistic_types() IS 'Returns the total number of stream statistic types.';

-- =============================================================================
-- ADVANCED STREAM STATISTICS MANAGEMENT FUNCTIONS
-- =============================================================================
-- Get latest statistic for stream and type
CREATE
OR REPLACE FUNCTION get_latest_statistic_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER
) RETURNS TABLE(
  statistic_in_time_id INTEGER,
  stream_id INTEGER,
  stream_statistic_type_id INTEGER,
  statistic_type_name TEXT,
  statistic_type_description TEXT,
  value INTEGER,
  timepoint TIMESTAMP(3)
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream ID
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type ID
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Return the latest statistic
    RETURN QUERY
    SELECT 
        s.statistic_in_time_id,
        s.stream_id,
        s.stream_statistic_type_id,
        t.name AS statistic_type_name,
        t.description AS statistic_type_description,
        s.value,
        s.timepoint
    FROM stream_statistics_in_time s
    JOIN stream_statistics_types t
      ON s.stream_statistic_type_id = t.stream_statistic_type_id
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
    ORDER BY s.timepoint DESC
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_latest_statistic_for_stream_and_type(INTEGER, INTEGER) 
IS 'Retrieves the latest statistic entry for a specific stream and statistic type.';

-- Get statistics count for stream
CREATE OR REPLACE FUNCTION count_statistics_for_stream(p_stream_id INTEGER) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    count_result INTEGER;
BEGIN
    -- Validate stream existence
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    SELECT COUNT(*) INTO count_result
    FROM stream_statistics_in_time
    WHERE stream_id = p_stream_id;

    RETURN count_result;
END;
$$;

COMMENT
  ON FUNCTION count_statistics_for_stream(INTEGER) IS 'Returns the total number of statistic entries for a specific stream.';

-- Get average statistic value for stream and type
-- Get average statistic value for stream and type
CREATE OR REPLACE FUNCTION get_average_statistic_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER
) RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE
    avg_value NUMERIC;
    stream_ended_at TIMESTAMP(3);
BEGIN
    -- Validate stream ID
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type ID
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    ----------------------------------------------------------------
    -- Detect if stream ended from streams table
    ----------------------------------------------------------------
    SELECT ended_at
    INTO stream_ended_at
    FROM streams
    WHERE stream_id = p_stream_id;

    ----------------------------------------------------------------
    -- Case 1: Stream still running (ended_at is NULL)
    ----------------------------------------------------------------
    IF stream_ended_at IS NULL THEN
        SELECT AVG(s.value) INTO avg_value
        FROM stream_statistics_in_time s
        WHERE s.stream_id = p_stream_id
          AND s.stream_statistic_type_id = p_stream_statistic_type_id;

        RETURN avg_value;
    END IF;

    ----------------------------------------------------------------
    -- Case 2: Stream ended → count only until ended_at
    ----------------------------------------------------------------
    SELECT AVG(s.value) INTO avg_value
    FROM stream_statistics_in_time s
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
      AND s.timepoint <= stream_ended_at;

    RETURN avg_value;
END;
$$;

COMMENT ON FUNCTION get_average_statistic_for_stream_and_type(INTEGER, INTEGER) 
IS 'Returns the average value of a statistic for the given stream and type. If the stream ended, averages only values until the ended_at.';

-- Get maximum statistic value for stream and type
CREATE OR REPLACE FUNCTION get_max_statistic_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    max_value INTEGER;
    stream_ended_at TIMESTAMP(3);
BEGIN
    -- Validate stream ID
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type ID
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    ----------------------------------------------------------------
    -- Detect if stream ended from streams table
    ----------------------------------------------------------------
    SELECT ended_at
    INTO stream_ended_at
    FROM streams
    WHERE stream_id = p_stream_id;

    ----------------------------------------------------------------
    -- Stream still running → take max from all data
    ----------------------------------------------------------------
    IF stream_ended_at IS NULL THEN
        SELECT MAX(s.value)
        INTO max_value
        FROM stream_statistics_in_time s
        WHERE s.stream_id = p_stream_id
          AND s.stream_statistic_type_id = p_stream_statistic_type_id;

        RETURN max_value;
    END IF;

    ----------------------------------------------------------------
    -- Stream ended → take max only until ended_at
    ----------------------------------------------------------------
    SELECT MAX(s.value)
    INTO max_value
    FROM stream_statistics_in_time s
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
      AND s.timepoint <= stream_ended_at;

    RETURN max_value;
END;
$$;

COMMENT ON FUNCTION get_max_statistic_for_stream_and_type(INTEGER, INTEGER) 
IS 'Returns the maximum value for the requested statistic type. If the stream ended, it only considers values up to ended_at.';

-- Get minimum statistic value for stream and type
CREATE OR REPLACE FUNCTION get_min_statistic_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    min_value INTEGER;
    stream_ended_at TIMESTAMP(3);
BEGIN
    -- Validate stream ID
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type ID
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    ----------------------------------------------------------------
    -- Detect if stream ended from streams table
    ----------------------------------------------------------------
    SELECT ended_at
    INTO stream_ended_at
    FROM streams
    WHERE stream_id = p_stream_id;

    ----------------------------------------------------------------
    -- Stream still active => take min from entire dataset
    ----------------------------------------------------------------
    IF stream_ended_at IS NULL THEN
        SELECT MIN(s.value)
        INTO min_value
        FROM stream_statistics_in_time s
        WHERE s.stream_id = p_stream_id
          AND s.stream_statistic_type_id = p_stream_statistic_type_id;

        RETURN min_value;
    END IF;

    ----------------------------------------------------------------
    -- Stream ended => take min only up to ended_at
    ----------------------------------------------------------------
    SELECT MIN(s.value)
    INTO min_value
    FROM stream_statistics_in_time s
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
      AND s.timepoint <= stream_ended_at;

    RETURN min_value;
END;
$$;

COMMENT ON FUNCTION get_min_statistic_for_stream_and_type(INTEGER, INTEGER) 
IS 'Gets the minimum statistic value for a specific stream and type. If the stream has ended, the result includes only values up to ended_at.';

-- Get sum of statistic values for stream and type
CREATE OR REPLACE FUNCTION get_sum_statistic_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER
) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
    sum_value BIGINT;
    stream_ended_at TIMESTAMP(3);
BEGIN
    -- Validate stream ID
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type ID
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    ----------------------------------------------------------------
    -- Detect if stream ended from streams table
    ----------------------------------------------------------------
    SELECT ended_at
    INTO stream_ended_at
    FROM streams
    WHERE stream_id = p_stream_id;

    ----------------------------------------------------------------
    -- Stream still active → sum of entire dataset
    ----------------------------------------------------------------
    IF stream_ended_at IS NULL THEN
        SELECT SUM(s.value)
        INTO sum_value
        FROM stream_statistics_in_time s
        WHERE s.stream_id = p_stream_id
          AND s.stream_statistic_type_id = p_stream_statistic_type_id;

        RETURN COALESCE(sum_value, 0);
    END IF;

    ----------------------------------------------------------------
    -- Stream ended → sum only up to ended_at
    ----------------------------------------------------------------
    SELECT SUM(s.value) INTO sum_value
    FROM stream_statistics_in_time s
    WHERE s.stream_id = p_stream_id
      AND s.stream_statistic_type_id = p_stream_statistic_type_id
      AND s.timepoint <= stream_ended_at;

    RETURN COALESCE(sum_value, 0);
END;
$$;

COMMENT ON FUNCTION get_sum_statistic_for_stream_and_type(INTEGER, INTEGER) 
IS 'Calculates the sum of statistic values for a specific stream and type. If the stream has ended, the sum includes only values up to ended_at.';
-- =============================================================================
-- BULK OPERATIONS AND MAINTENANCE FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_old_statistics(p_before_date TIMESTAMP(3)) 
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER := 0;  
BEGIN
    DELETE FROM stream_statistics_in_time
    WHERE timepoint < p_before_date;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

COMMENT
  ON FUNCTION delete_old_statistics(TIMESTAMP) IS 'Deletes all statistic entries older than the specified date. Returns the number of deleted records.';


-- Delete old statistics for stream before date
CREATE
OR REPLACE FUNCTION delete_old_statistics_for_stream(p_stream_id INTEGER, p_before_date TIMESTAMP(3)) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM stream_statistics_in_time
    WHERE stream_id = p_stream_id
      AND timepoint < p_before_date;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT
  ON FUNCTION delete_old_statistics_for_stream(INTEGER, TIMESTAMP) IS 'Deletes statistic entries for a specific stream older than the specified date. Returns the number of deleted records.';

-- =============================================================================
-- AGGREGATION AND REPORTING FUNCTIONS
-- =============================================================================
-- Get hourly aggregated statistics
CREATE OR REPLACE FUNCTION get_hourly_statistics_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER,
  p_start_date TIMESTAMP(3),
  p_end_date TIMESTAMP(3)
) RETURNS TABLE(
  hour_timestamp TIMESTAMP(3),
  avg_value NUMERIC,
  min_value INTEGER,
  max_value INTEGER,
  count_entries INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate dates
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date must not be NULL.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date (%) cannot be greater than end date (%).', 
            p_start_date, p_end_date
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Main query
    RETURN QUERY
    SELECT
      date_trunc('hour', timepoint) AS hour_timestamp,
      AVG(value) AS avg_value,
      MIN(value) AS min_value,
      MAX(value) AS max_value,
      COUNT(*) AS count_entries
    FROM stream_statistics_in_time
    WHERE stream_id = p_stream_id
      AND stream_statistic_type_id = p_stream_statistic_type_id
      AND timepoint >= p_start_date
      AND timepoint <= p_end_date
    GROUP BY hour_timestamp
    ORDER BY hour_timestamp;
END;
$$;

COMMENT ON FUNCTION get_hourly_statistics_for_stream_and_type(
    INTEGER,
    INTEGER,
    TIMESTAMP(3),
    TIMESTAMP(3)
) IS
'Returns hourly aggregated statistics (avg, min, max, count) for a stream and type within a date range.';

-- Get daily aggregated statistics
CREATE OR REPLACE FUNCTION get_daily_statistics_for_stream_and_type(
  p_stream_id INTEGER,
  p_stream_statistic_type_id INTEGER,
  p_start_date TIMESTAMP(3),
  p_end_date TIMESTAMP(3)
) RETURNS TABLE(
  day_date DATE,
  avg_value NUMERIC,
  min_value INTEGER,
  max_value INTEGER,
  count_entries INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate stream
    IF NOT check_if_stream_exists(p_stream_id) THEN
        RAISE EXCEPTION 'Stream with ID % does not exist.', p_stream_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate statistic type
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    -- Validate dates
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date must not be NULL.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date (%) cannot be greater than end date (%).', 
            p_start_date, p_end_date
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Main query
    RETURN QUERY
    SELECT
      date_trunc('day', timepoint)::date AS day_date,
      AVG(value) AS avg_value,
      MIN(value) AS min_value,
      MAX(value) AS max_value,
      COUNT(*) AS count_entries
    FROM stream_statistics_in_time
    WHERE stream_id = p_stream_id
      AND stream_statistic_type_id = p_stream_statistic_type_id
      AND timepoint >= p_start_date
      AND timepoint <= p_end_date
    GROUP BY day_date
    ORDER BY day_date;

END;
$$;

COMMENT ON FUNCTION get_daily_statistics_for_stream_and_type(
    INTEGER, INTEGER, TIMESTAMP, TIMESTAMP
) IS 'Returns daily aggregated statistics (avg, min, max, count) for a stream and type within a date range.';

-- Get top streams by statistic value
CREATE OR REPLACE FUNCTION get_top_streams_by_statistic_type(
  p_stream_statistic_type_id INTEGER,
  p_limit INTEGER DEFAULT 10,
  p_start_date TIMESTAMP(3) DEFAULT NULL,
  p_end_date TIMESTAMP(3) DEFAULT NULL
) RETURNS TABLE(
  stream_id INTEGER,
  total_value BIGINT,
  avg_value NUMERIC,
  max_value INTEGER,
  count_entries INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    -- Validate statistic type
    IF NOT statistic_type_exists_by_id(p_stream_statistic_type_id) THEN
        RAISE EXCEPTION 'Stream statistic type with ID % does not exist.', p_stream_statistic_type_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    RETURN QUERY
    SELECT 
        s.stream_id,
        SUM(s.value) AS total_value,
        AVG(s.value) AS avg_value,
        MAX(s.value) AS max_value,
        COUNT(*) AS count_entries
    FROM stream_statistics_in_time s
    WHERE s.stream_statistic_type_id = p_stream_statistic_type_id
      AND (p_start_date IS NULL OR s.timepoint >= p_start_date)
      AND (p_end_date IS NULL OR s.timepoint <= p_end_date)
    GROUP BY s.stream_id
    ORDER BY total_value DESC
    LIMIT p_limit;
END;
$$;
COMMENT
  ON FUNCTION get_top_streams_by_statistic_type(INTEGER, INTEGER, TIMESTAMP, TIMESTAMP) IS 'Returns the top streams ranked by total statistic value for a specific type, optionally within a date range.';

-- =============================================================================
-- UTILITY AND VALIDATION FUNCTIONS
-- =============================================================================
-- Validate statistic entry exists
-- CREATE
-- OR REPLACE FUNCTION statistic_entry_exists(p_id INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
-- BEGIN
--     -- Function implementation will be added here
--     RETURN FALSE;
-- END;
-- $$;

-- COMMENT
--   ON FUNCTION statistic_entry_exists(INTEGER) IS 'Checks if a statistic entry with the given ID exists. Returns TRUE if exists, FALSE otherwise.';

-- Get database statistics summary
CREATE OR REPLACE FUNCTION get_statistics_summary()
RETURNS TABLE(
  total_statistic_types INTEGER,
  total_statistic_entries BIGINT,
  oldest_entry_date TIMESTAMP(3),
  newest_entry_date TIMESTAMP(3),
  total_streams_with_statistics INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.total_statistic_types,
        s.total_statistic_entries,
        s.oldest_entry_date,
        s.newest_entry_date,
        s.total_streams_with_statistics
    FROM
        (SELECT COUNT(*) AS total_statistic_types
         FROM stream_statistics_types) t,
        (SELECT 
             COUNT(*) AS total_statistic_entries,
             MIN(timepoint) AS oldest_entry_date,
             MAX(timepoint) AS newest_entry_date,
             COUNT(DISTINCT stream_id) AS total_streams_with_statistics
         FROM stream_statistics_in_time) s;
END;
$$;

COMMENT ON FUNCTION get_statistics_summary() 
IS 'Returns a summary of all statistics in the database including counts, date ranges, and streams with statistics.';
