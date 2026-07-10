export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const DataCompletionSchema = z.object({
  baptism_name: z.string().optional(),
  nik: z.string().optional(),
  gender: z.enum(['L', 'P']).optional(),
  date_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = DataCompletionSchema.parse(body);

    // Update profile with completion data
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        profile_completed: true,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Data completion error:', updateError);
      return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data profil berhasil dilengkapi',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Data completion error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}