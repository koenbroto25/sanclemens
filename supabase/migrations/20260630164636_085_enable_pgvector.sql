-- Enable the pgvector extension to support VECTOR(768) data type
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;