import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchContentFromR2 } from '@/lib/r2-client';

export const dynamic = 'force-dynamic';

// ============================================================
// RAG Maintenance Cron — v6.1
// Purpose: Health check & maintenance for RAG + R2 system
// ============================================================

interface MaintenanceStats {
  total_chunks: number;
  outdated_embeddings: number;
  orphaned_r2_keys: number;
  missing_r2_keys: number;
  errors: string[];
}

export async function POST(request: Request) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const stats: MaintenanceStats = {
      total_chunks: 0,
      outdated_embeddings: 0,
      orphaned_r2_keys: 0,
      missing_r2_keys: 0,
      errors: []
    };

    // 2. Check theological_chunks
    console.log('[RAG Maintenance] Checking theological_chunks...');
    const { data: theologicalChunks, error: theologicalError } = await supabase
      .from('theological_chunks')
      .select('id, content_r2_key, embedding_outdated')
      .limit(1000); // Batch check

    if (theologicalError) {
      stats.errors.push(`theological_chunks query failed: ${theologicalError.message}`);
    } else if (theologicalChunks) {
      stats.total_chunks += theologicalChunks.length;
      stats.outdated_embeddings += theologicalChunks.filter(c => c.embedding_outdated).length;

      // Check orphaned R2 keys (R2 object doesn't exist)
      for (const chunk of theologicalChunks) {
        if (chunk.content_r2_key) {
          try {
            const content = await fetchContentFromR2(chunk.content_r2_key);
            if (content === null) {
              stats.orphaned_r2_keys++;
              console.warn(`[RAG Maintenance] Orphaned R2 key: ${chunk.content_r2_key}`);
            }
          } catch (error) {
            // Skip check on error - don't block maintenance
          }
        } else {
          stats.missing_r2_keys++;
        }
      }
    }

    // 3. Check operational_chunks
    console.log('[RAG Maintenance] Checking operational_chunks...');
    const { data: operationalChunks, error: operationalError } = await supabase
      .from('operational_chunks')
      .select('id, content_r2_key, embedding_outdated')
      .limit(1000);

    if (operationalError) {
      stats.errors.push(`operational_chunks query failed: ${operationalError.message}`);
    } else if (operationalChunks) {
      stats.total_chunks += operationalChunks.length;
      stats.outdated_embeddings += operationalChunks.filter(c => c.embedding_outdated).length;

      for (const chunk of operationalChunks) {
        if (chunk.content_r2_key) {
          try {
            const content = await fetchContentFromR2(chunk.content_r2_key);
            if (content === null) {
              stats.orphaned_r2_keys++;
            }
          } catch (error) {
            // Skip
          }
        } else {
          stats.missing_r2_keys++;
        }
      }
    }

    // 4. Check structured_entity_chunks
    console.log('[RAG Maintenance] Checking structured_entity_chunks...');
    const { data: structuredChunks, error: structuredError } = await supabase
      .from('structured_entity_chunks')
      .select('id, content_r2_key, embedding_outdated')
      .limit(1000);

    if (structuredError) {
      stats.errors.push(`structured_entity_chunks query failed: ${structuredError.message}`);
    } else if (structuredChunks) {
      stats.total_chunks += structuredChunks.length;
      stats.outdated_embeddings += structuredChunks.filter(c => c.embedding_outdated).length;

      for (const chunk of structuredChunks) {
        if (chunk.content_r2_key) {
          try {
            const content = await fetchContentFromR2(chunk.content_r2_key);
            if (content === null) {
              stats.orphaned_r2_keys++;
            }
          } catch (error) {
            // Skip
          }
        } else {
          stats.missing_r2_keys++;
        }
      }
    }

    // 5. Check qa_pairs
    console.log('[RAG Maintenance] Checking qa_pairs...');
    const { data: qaPairs, error: qaError } = await supabase
      .from('qa_pairs')
      .select('id, answer_r2_key, embedding_outdated')
      .limit(1000);

    if (qaError) {
      stats.errors.push(`qa_pairs query failed: ${qaError.message}`);
    } else if (qaPairs) {
      stats.total_chunks += qaPairs.length;
      stats.outdated_embeddings += qaPairs.filter(q => q.embedding_outdated).length;

      for (const qa of qaPairs) {
        if (qa.answer_r2_key) {
          try {
            const content = await fetchContentFromR2(qa.answer_r2_key);
            if (content === null) {
              stats.orphaned_r2_keys++;
            }
          } catch (error) {
            // Skip
          }
        } else {
          stats.missing_r2_keys++;
        }
      }
    }

    // 6. Determine health status
    const healthStatus = stats.errors.length === 0 ? 'healthy' : 'degraded';
    const needsAttention = stats.outdated_embeddings > 0 || stats.orphaned_r2_keys > 0 || stats.missing_r2_keys > 0;

    console.log('[RAG Maintenance] Stats:', stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: healthStatus,
      needs_attention: needsAttention,
      stats,
      recommendations: generateRecommendations(stats)
    });

  } catch (error: any) {
    console.error('[RAG Maintenance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'RAG maintenance failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPER: Generate actionable recommendations
// ============================================================

function generateRecommendations(stats: MaintenanceStats): string[] {
  const recommendations: string[] = [];

  if (stats.outdated_embeddings > 0) {
    recommendations.push(`Run embedding regeneration for ${stats.outdated_embeddings} outdated chunks`);
  }

  if (stats.orphaned_r2_keys > 0) {
    recommendations.push(`Clean up ${stats.orphaned_r2_keys} orphaned R2 objects`);
  }

  if (stats.missing_r2_keys > 0) {
    recommendations.push(`CRITICAL: ${stats.missing_r2_keys} records missing R2 keys - run migration script`);
  }

  if (stats.errors.length > 0) {
    recommendations.push(`Fix ${stats.errors.length} database errors`);
  }

  if (recommendations.length === 0) {
    recommendations.push('System healthy - no action needed');
  }

  return recommendations;
}