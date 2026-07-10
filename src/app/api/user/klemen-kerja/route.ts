export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'jobs' or 'workers'

    if (type === 'jobs') {
      // Get job listings
      const { data: jobs, error } = await supabase
        .from('klemen_kerja_jobs')
        .select('*, profiles(full_name, phone, lingkungan_slug)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Gagal mengambil lowongan' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: jobs });
    } else if (type === 'workers') {
      // Get worker profiles
      const { data: workers, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, skills, pekerjaan, pengalaman, lingkungan_slug')
        .not('skills', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Gagal mengambil data pekerja' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: workers });
    }

    return NextResponse.json({ error: 'Type parameter required (jobs/workers)' }, { status: 400 });
  } catch (error) {
    console.error('Get klemen-kerja error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await request.json();

    switch (action) {
      case 'post-job': {
        const { title, description, category, budget, deadline } = payload;
        
        const { data: job, error } = await supabase
          .from('klemen_kerja_jobs')
          .insert({
            poster_id: user.id,
            title,
            description,
            category,
            budget,
            deadline,
            status: 'open',
          })
          .single();

        if (error) {
          return NextResponse.json({ error: 'Gagal memposting lowongan' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: job });
      }

      case 'apply': {
        const { job_id, proposal } = payload;
        
        const { data: application, error } = await supabase
          .from('klemen_kerja_applications')
          .insert({
            job_id,
            applicant_id: user.id,
            proposal,
            status: 'pending',
          })
          .single();

        if (error) {
          return NextResponse.json({ error: 'Gagal melamar' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: application });
      }

      case 'update-skills': {
        const { skills, pekerjaan, pengalaman } = payload;
        
        const { error } = await supabase
          .from('profiles')
          .update({
            skills,
            pekerjaan,
            pengalaman,
          })
          .eq('id', user.id);

        if (error) {
          return NextResponse.json({ error: 'Gagal update profil pekerja' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Profil pekerja berhasil diupdate' });
      }

      default:
        return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 });
    }
  } catch (error) {
    console.error('Klemen kerja error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}