export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'paroki-klemens-rag-content';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const isAuthenticated = !!user.user;
    const { slug } = params;

    // Fetch module metadata
    const { data: mod, error } = await supabase
      .from('catechism_modules')
      .select(`
        id,
        slug,
        code,
        title,
        subtitle,
        order_index,
        opening_quote_text,
        opening_quote_source,
        content_r2_key,
        content_preview,
        estimated_minutes,
        prev_module_id,
        next_module_id,
        stage_id,
        catechism_stages!inner (
          title,
          slug,
          color_theme,
          icon_slug
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // If authenticated, check progress
    let userStatus = isAuthenticated ? 'locked' : null;
    let userProgress = 0;
    let userQuizPassed = false;

    if (isAuthenticated && user.user) {
      const { data: progress } = await supabase
        .from('catechism_progress')
        .select('status, scroll_progress_pct, quiz_passed')
        .eq('user_id', user.user.id)
        .eq('module_id', mod.id)
        .single();

      if (progress) {
        userStatus = progress.status;
        userProgress = progress.scroll_progress_pct;
        userQuizPassed = progress.quiz_passed;
      } else {
        // Check if this is the first module (order_index = 0) or should be seeded
        const { data: firstMod } = await supabase
          .from('catechism_modules')
          .select('id')
          .eq('order_index', 0)
          .single();
        
        if (firstMod && firstMod.id === mod.id) {
          // Auto-seed progress for first module
          await supabase
            .from('catechism_progress')
            .insert({ user_id: user.user.id, module_id: mod.id, status: 'unlocked' })
            .select('status');
          userStatus = 'unlocked';
        } else {
          return NextResponse.json({ error: 'Module locked', status: 'locked' }, { status: 403 });
        }
      }
    }

    // Guard: locked modules cannot be read
    if (isAuthenticated && userStatus === 'locked') {
      return NextResponse.json({ error: 'Module locked', status: 'locked' }, { status: 403 });
    }

    // Fetch full markdown from R2 using S3 SDK
    let contentMarkdown = '';
    try {
      const r2Client = getR2Client();
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: mod.content_r2_key,
      });
      const response = await r2Client.send(command);
      if (response.Body) {
        contentMarkdown = await response.Body.transformToString('utf-8');
      }
    } catch (e) {
      console.error('Error fetching from R2:', e);
      contentMarkdown = mod.content_preview || '';
    }

    // Get prev/next slugs
    let prevModule = null;
    let nextModule = null;
    if (mod.prev_module_id) {
      const { data: prev } = await supabase
        .from('catechism_modules')
        .select('slug, code, title')
        .eq('id', mod.prev_module_id)
        .single();
      if (prev) prevModule = prev;
    }
    if (mod.next_module_id) {
      const { data: next } = await supabase
        .from('catechism_modules')
        .select('slug, code, title')
        .eq('id', mod.next_module_id)
        .single();
      if (next) nextModule = next;
    }

    return NextResponse.json({
      data: {
        ...mod,
        content_markdown: contentMarkdown,
        prev_module: prevModule,
        next_module: nextModule,
        user_status: userStatus,
        user_progress: userProgress,
        user_quiz_passed: userQuizPassed,
      },
      success: true,
    });
  } catch (error) {
    console.error('Server error in GET /api/catechism/modules/[slug]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}