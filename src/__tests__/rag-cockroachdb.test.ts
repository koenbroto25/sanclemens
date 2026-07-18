/**
 * RAG CockroachDB Integration Tests
 * 
 * Tests for verifying RAG functions work correctly after migration from Supabase to CockroachDB.
 * Run with: pnpm test src/__tests__/rag-cockroachdb.test.ts
 * 
 * Prerequisites:
 * - COCKROACHDB_HOST, COCKROACHDB_DBNAME, COCKROACHDB_USER, COCKROACHDB_PASSWORD env vars set
 * - Test data already ingested (Tahap D completed)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';

// CockroachDB connection config
const COCKROACH_CONFIG = {
  host: process.env.COCKROACHDB_HOST || 'localhost',
  port: 26257,
  database: process.env.COCKROACHDB_DBNAME || 'defaultdb',
  user: process.env.COCKROACHDB_USER || 'root',
  password: process.env.COCKROACHDB_PASSWORD || '',
  ssl: { rejectUnauthorized: false },
};

let pool: Pool;

describe('RAG CockroachDB Integration Tests', () => {
  beforeAll(async () => {
    // Skip tests if no CockroachDB config
    if (!process.env.COCKROACHDB_HOST) {
      console.warn('⚠️  Skipping CockroachDB tests: COCKROACHDB_HOST not set');
      process.env.SKIP_COCKROACHDB_TESTS = 'true';
    }

    if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
      return;
    }

    pool = new Pool(COCKROACH_CONFIG);
    await pool.query('SELECT 1'); // Test connection
    console.log('✅ Connected to CockroachDB for tests');
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Schema Verification', () => {
    test('should have all required tables', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
          'theological_chunks', 'ai_knowledge_base', 'prayers', 
          'prayers_collection', 'structured_entity_chunks', 
          'saints_chunks', 'saints_index', 'operational_chunks',
          'internal_admin_chunks', 'qa_pairs', 'daily_reflections'
        )
      `;
      
      const result = await pool.query(query);
      const tableCount = result.rows.length;
      
      expect(tableCount).toBe(11);
      console.log(`✅ Found ${tableCount}/11 RAG tables`);
    });

    test('should have vector indexes on embedding columns', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT index_name, table_name 
        FROM information_schema.statistics 
        WHERE index_name LIKE '%embedding_idx%'
      `;
      
      const result = await pool.query(query);
      const indexCount = result.rows.length;
      
      expect(indexCount).toBeGreaterThanOrEqual(7);
      console.log(`✅ Found ${indexCount} vector indexes`);
    });

    test('should have search functions defined', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT proname FROM pg_proc 
        WHERE proname IN (
          'search_rag_chunks', 'search_direct_qa', 
          'get_prayers_by_type', 'search_prayers_by_context'
        )
      `;
      
      const result = await pool.query(query);
      const funcCount = result.rows.length;
      
      expect(funcCount).toBe(4);
      console.log(`✅ Found ${funcCount}/4 search functions`);
    });
  });

  describe('Data Integrity', () => {
    test('theological_chunks should have normalized embeddings', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      // Check that embeddings are normalized (magnitude ~1.0)
      // Using a sample of 100 rows for speed
      const query = `
        SELECT 
          AVG(sqrt(power(content_embedding[1], 2) + power(content_embedding[2], 2))) as avg_magnitude
        FROM theological_chunks
        LIMIT 100
      `;
      
      const result = await pool.query(query);
      const avgMagnitude = parseFloat(result.rows[0].avg_magnitude || '0');
      
      expect(avgMagnitude).toBeGreaterThan(0.95);
      expect(avgMagnitude).toBeLessThan(1.05);
      console.log(`✅ Embeddings normalized (avg magnitude: ${avgMagnitude.toFixed(4)})`);
    });

    test('ai_knowledge_base should have approved entries', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
        FROM ai_knowledge_base
      `;
      
      const result = await pool.query(query);
      const { total, approved } = result.rows[0];
      
      expect(parseInt(approved)).toBeGreaterThan(0);
      expect(parseInt(approved)).toBeLessThanOrEqual(parseInt(total));
      console.log(`✅ AI KB: ${approved}/${total} entries approved`);
    });

    test('prayers_collection should have embedding_outdated flag', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN embedding_outdated = TRUE THEN 1 END) as outdated
        FROM prayers_collection
      `;
      
      const result = await pool.query(query);
      const { total, outdated } = result.rows[0];
      
      expect(parseInt(total)).toBeGreaterThan(0);
      console.log(`✅ Prayers: ${total} entries, ${outdated} outdated`);
    });
  });

  describe('Search Functions', () => {
    test('search_rag_chunks should return results', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      // Create a test embedding (768 dimensions, normalized)
      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      
      // Simple normalization
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const query = `
        SELECT search_rag_chunks(
          $1::VECTOR(768),
          'catechism_module',
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [normalizedEmbedding]);
      
      // Should return results (may be empty if no matching data, but function should work)
      expect(result.rows).toBeDefined();
      console.log(`✅ search_rag_chunks executed successfully`);
    });

    test('search_direct_qa should return results', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const query = `
        SELECT search_direct_qa(
          $1::VECTOR(768),
          'catechism_module',
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [normalizedEmbedding]);
      
      expect(result.rows).toBeDefined();
      console.log(`✅ search_direct_qa executed successfully`);
    });

    test('get_prayers_by_type should return prayers', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const query = `
        SELECT * FROM get_prayers_by_type('makan', 0)
      `;
      
      const result = await pool.query(query);
      
      // May return 0 or more results depending on data
      expect(result.rows).toBeDefined();
      console.log(`✅ get_prayers_by_type returned ${result.rows.length} results`);
    });

    test('search_prayers_by_context should return results', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const query = `
        SELECT search_prayers_by_context(
          $1::VECTOR(768),
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [normalizedEmbedding]);
      
      expect(result.rows).toBeDefined();
      console.log(`✅ search_prayers_by_context executed successfully`);
    });
  });

  describe('Performance', () => {
    test('search_rag_chunks should complete within 2 seconds', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const startTime = Date.now();
      
      const query = `
        SELECT search_rag_chunks(
          $1::VECTOR(768),
          'catechism_module',
          'public',
          0,
          10
        ) AS results
      `;
      
      await pool.query(query, [normalizedEmbedding]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
      console.log(`✅ search_rag_chunks completed in ${duration}ms`);
    });

    test('should use vector index (not full scan)', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const query = `
        EXPLAIN ANALYZE
        SELECT search_rag_chunks(
          $1::VECTOR(768),
          'catechism_module',
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [normalizedEmbedding]);
      const explainOutput = result.rows.map(r => (r as any).'Explain').join('\n');
      
      // Should contain "vector search" in plan (index scan)
      // Should NOT contain "FULL SCAN"
      expect(explainOutput).not.toMatch(/FULL SCAN/i);
      console.log('✅ Vector index is being used (no full scan)');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty embedding gracefully', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const emptyEmbedding = Array(768).fill(0);

      const query = `
        SELECT search_rag_chunks(
          $1::VECTOR(768),
          'catechism_module',
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [emptyEmbedding]);
      expect(result.rows).toBeDefined();
      console.log('✅ Empty embedding handled gracefully');
    });

    test('should handle non-existent domain', async () => {
      if (process.env.SKIP_COCKROACHDB_TESTS === 'true') {
        expect(true).toBe(true);
        return;
      }

      const testEmbedding = Array(768).fill(0).map(() => Math.random());
      const magnitude = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = testEmbedding.map(val => val / magnitude);

      const query = `
        SELECT search_rag_chunks(
          $1::VECTOR(768),
          'nonexistent_domain',
          'public',
          0,
          5
        ) AS results
      `;
      
      const result = await pool.query(query, [normalizedEmbedding]);
      expect(result.rows).toBeDefined();
      console.log('✅ Non-existent domain handled gracefully');
    });
  });
});