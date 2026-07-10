export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job_id, job_requirements, limit = 5 } = await request.json();

    if (!job_id || !job_requirements) {
      return NextResponse.json({ error: 'job_id dan job_requirements harus diisi' }, { status: 400 });
    }

    // Get job details
    const { data: job } = await supabase
      .from('lowongan_kerja')
      .select('*, profiles!posted_by(full_name, lingkungan_slug)')
      .eq('id', job_id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Lowongan tidak ditemukan' }, { status: 404 });
    }

    if (job.status !== 'open') {
      return NextResponse.json({ error: 'Lowongan sudah ditutup' }, { status: 400 });
    }

    // Get available workers
    const { data: workers } = await supabase
      .from('tenaga_kerja')
      .select('*, profiles(full_name, lingkungan_slug)')
      .eq('tersedia', true)
      .limit(50); // Get pool of workers

    if (!workers || workers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          candidates: [],
          total_available: 0
        }
      });
    }

    // Calculate match scores
    const candidates = workers
      .map(worker => {
        const matchResult = calculateWorkerMatchScore(worker, job_requirements);
        return {
          ...matchResult,
          worker_id: worker.id,
          worker_details: {
            name: worker.profiles?.full_name || 'Tidak diketahui',
            skills: worker.keahlian || [],
            experience_years: worker.pengalaman_tahun || 0,
            rating: worker.rating || 0,
            total_jobs_completed: worker.total_jobs_completed || 0,
            location: worker.profiles?.lingkungan_slug || '-'
          }
        };
      })
      .filter(candidate => candidate.match_score > 0.3)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        candidates,
        total_available: workers.length
      }
    });

  } catch (error) {
    console.error('Find workers error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

function calculateWorkerMatchScore(worker: any, requirements: any): { match_score: number; skills_match_percentage: number } {
  const workerSkills = worker.keahlian || [];
  const requiredSkills = requirements.skills_required || [];
  
  // Skills match percentage
  const matchingSkills = workerSkills.filter((s: string) => requiredSkills.includes(s)).length;
  const skillsMatchPercentage = requiredSkills.length > 0 
    ? matchingSkills / requiredSkills.length 
    : 0.5; // Default 50% if no specific requirements

  // Location preference (bonus if same lingkungan)
  const locationBonus = worker.profiles?.lingkungan_slug === requirements.location ? 0.1 : 0;

  // Experience bonus
  const experienceBonus = Math.min((worker.pengalaman_tahun || 0) / 5, 0.15); // Max 15% for 5+ years

  // Rating bonus
  const ratingBonus = Math.min((worker.rating || 0) / 5, 0.1); // Max 10% for 5-star rating

  // Total score (skills 60% + location 10% + experience 15% + rating 10% + availability 5%)
  const totalScore = Math.min(
    (skillsMatchPercentage * 0.6) + locationBonus + experienceBonus + ratingBonus + 0.05,
    1
  );

  return {
    match_score: totalScore,
    skills_match_percentage: skillsMatchPercentage
  };
}