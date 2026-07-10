export const dynamic = 'force-dynamic'
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Adjust import based on your setup

// Placeholder for actual matching logic (to be implemented or imported)
async function calculateWorkerMatches(job: any, availableWorkers: any[]): Promise<any[]> {
  // This is a simplified placeholder. Real logic would involve:
  // 1. Skill matching
  // 2. Location proximity
  // 3. GAKIN priority boost
  // 4. Worker availability
  // 5. Rating and experience
  // For now, return a dummy match
  return availableWorkers.slice(0, 3).map(worker => ({
    worker_id: worker.profile_id,
    match_score: Math.random(), // Dummy score
  }));
}

export async function POST(request: NextRequest) {
  // Verify auth using CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // 1. Get all open jobs
  const { data: openJobs, error: jobsError } = await supabase
    .from('lowongan_kerja')
    .select('id, jenis_pekerjaan, tags, lingkungan_id, is_verified')
    .eq('status', 'open')
    .gte('expires_at', new Date().toISOString());

  if (jobsError) {
    console.error('Error fetching open jobs:', jobsError.message);
    return NextResponse.json({ error: jobsError.message }, { status: 500 });
  }

  // 2. Get all available workers with their profile_id and relevant skills/location
  const { data: availableWorkers, error: workersError } = await supabase
    .from('tenaga_kerja')
    .select('profile_id, keahlian, tersedia') // Select only necessary fields
    .eq('tersedia', true);

  if (workersError) {
    console.error('Error fetching available workers:', workersError.message);
    return NextResponse.json({ error: workersError.message }, { status: 500 });
  }

  let jobsMatched = 0;
  let applicationsCreated = 0;

  for (const job of openJobs || []) {
    // Call matching logic (server-side, no auth needed from user)
    // Pass only relevant data to avoid over-fetching and context issues
    const matches = await calculateWorkerMatches(job, availableWorkers || []);
    
    // Create applications for top matches (e.g., top 3)
    for (const match of matches.slice(0, 3)) {
      const { error: insertError } = await supabase.from('lowongan_lamaran').insert({
        lowongan_id: job.id,
        pelamar_id: match.worker_id,
        match_score: match.match_score,
        status: 'melamar', // Default status
      });

      if (insertError) {
        console.error(`Error creating application for job ${job.id} and worker ${match.worker_id}:`, insertError.message);
      } else {
        applicationsCreated++;
      }
    }
    jobsMatched++;
  }

  return NextResponse.json({
    success: true,
    jobs_processed: openJobs?.length || 0,
    applications_created: applicationsCreated,
    jobs_with_matches: jobsMatched,
  });
}