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

    const { skills, preferences, limit = 3 } = await request.json();

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('lingkungan_id, family_id')
      .eq('id', user.id)
      .single();

    // Check GAKIN status for priority boost
    let isGakin = false;
    if (profile?.family_id) {
      const { data: gakinData } = await supabase
        .from('data_gakin')
        .select('status')
        .eq('family_id', profile.family_id)
        .in('status', ['active', 'pending'])
        .single();
      isGakin = !!gakinData;
    }

    // Build query for open jobs
    let query = supabase
      .from('lowongan_kerja')
      .select('*, profiles!posted_by(full_name, lingkungan_slug)')
      .eq('status', 'open')
      .gte('expires_at', new Date().toISOString());

    // Get all open jobs
    const { data: allJobs } = await query;

    if (!allJobs || allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          matches: [],
          total_available: 0,
          reasoning: {
            algorithm: "skills (30%) + location (30%) + urgency (20%) + availability (20%)",
            gakin_boost: isGakin ? "User memiliki GAKIN aktif - mendapat prioritas +15%" : "Tidak ada GAKIN"
          }
        }
      });
    }

    // Calculate match scores
    const matches = allJobs
      .map(job => {
        const matchResult = calculateMatchScore(job, skills, profile?.lingkungan_id, isGakin);
        return {
          ...matchResult,
          lowongan_id: job.id,
          job_details: {
            title: job.jenis_pekerjaan,
            description: job.deskripsi,
            budget: job.estimasi_gaji,
            location: job.lokasi,
            duration: job.durasi,
            posted_by: {
              name: job.profiles?.full_name || 'Tidak diketahui',
              lingkungan: job.profiles?.lingkungan_slug || '-'
            }
          }
        };
      })
      .filter(match => match.match_score > 0.3) // Only show matches >30%
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        matches,
        total_available: allJobs.length,
        reasoning: {
          algorithm: "skills (30%) + location (30%) + urgency (20%) + availability (20%)",
          gakin_boost: isGakin ? "User memiliki GAKIN aktif - mendapat prioritas +15%" : "Tidak ada GAKIN"
        }
      }
    });

  } catch (error) {
    console.error('Find jobs error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

function calculateMatchScore(
  job: any,
  userSkills: string[],
  userLingkunganId: string | undefined,
  isGakin: boolean
): { match_score: number; matching_factors: any } {
  let scores = {
    skills_match: 0,
    location_match: 0,
    urgency_match: 0,
    availability_match: 0
  };

  // Skills match (30%)
  const jobTags = job.tags || [];
  const skillMatches = userSkills.filter(s => jobTags.includes(s)).length;
  scores.skills_match = Math.min(skillMatches / Math.max(userSkills.length, 1), 1) * 0.3;

  // Location match (30%) - prefer same lingkungan
  if (job.lingkungan_id === userLingkunganId) {
    scores.location_match = 0.3; // Full score for same lingkungan
  } else if (!job.lingkungan_id) {
    scores.location_match = 0.15; // Partial if no location specified
  } else {
    scores.location_match = 0.05; // Different lingkungan
  }

  // Urgency match (20%)
  const urgencyScore = job.is_verified ? 0.15 : 0.1; // Verified jobs get higher urgency
  scores.urgency_match = urgencyScore;

  // Availability (20%)
  scores.availability_match = 0.2; // All posted jobs are by definition available

  // GAKIN priority boost (+15%)
  const baseScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const gakinBoost = isGakin ? 0.15 : 0;

  const totalScore = Math.min(baseScore + gakinBoost, 1);

  return {
    match_score: totalScore,
    matching_factors: scores
  };
}