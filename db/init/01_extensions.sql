-- PostgreSQL initialization script
-- Runs automatically when the Postgres container is first created

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Trade Tracker database initialized successfully';
END $$;
