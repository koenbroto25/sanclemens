-- Create custom schemas required by config.toml for PostgREST
-- These schemas are referenced in api.schemas and api.extra_search_path

CREATE SCHEMA IF NOT EXISTS companion;
CREATE SCHEMA IF NOT EXISTS liturgical;
CREATE SCHEMA IF NOT EXISTS theology;

-- Grant usage to postgres and anon roles
GRANT USAGE ON SCHEMA companion TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA liturgical TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA theology TO postgres, anon, authenticated, service_role;

-- Note: Actual tables in these schemas will be created in future migrations
-- as needed by their respective features (Companion E2E, Liturgical Calendar, etc.)