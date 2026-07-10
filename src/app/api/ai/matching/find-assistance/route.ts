import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const { user_id, need_type, urgency, description, include_gakin_data } = await request.json();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookies().getAll() }, setAll(cs) { cs.forEach(({ name, value, options }) => cookies().set(name, value, options)) } } });

    // Implementasi logika find-assistance di sini
    // 1. Check GAKIN status via check_gakin_priority function
    // 2. Analyze family size, financial condition (if include_gakin_data is true)
    // 3. Match with donatur_potensial based on preferences, location, etc.
    // 4. Ensure anonymity: Reveal donor name ONLY after match accepted

    const { data: gakinData, error: gakinError } = await supabase.rpc('check_gakin_priority', { p_user_id: user_id });
    if (gakinError) {
        console.error('Error checking GAKIN priority:', gakinError);
        return NextResponse.json({ error: 'Failed to check GAKIN priority' }, { status: 500 });
    }

    const is_gakin = gakinData?.is_gakin || false;
    const priority_tier = gakinData?.priority_tier || 'standard';
    const priority_boost_applied = is_gakin && (priority_tier === 'elevated' || priority_tier === 'critical');

    // 1. Dapatkan lingkungan_id pengguna yang meminta bantuan
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('lingkungan_id')
        .eq('id', user_id)
        .single();

    if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const user_lingkungan_id = userProfile.lingkungan_id;

    // 2. Query donatur_potensial
    let query = supabase
        .from('donatur_potensial')
        .select('*, profiles(full_name, lingkungan_id)');

    // Filter berdasarkan preferensi (need_type)
    query = query.filter('preferensi', 'cs', `{${need_type}}`);

    // Prioritaskan lokasi yang sama jika ada, atau perluas cakupan
    if (user_lingkungan_id) {
        query = query.or(`preferensi_lokasi.cs.{${user_lingkungan_id}},preferensi_lokasi.eq.{}`, { foreignTable: 'profiles' });
    }

    // Hanya donatur aktif
    query = query.eq('is_active', true);

    const { data: potentialDonors, error: donorsError } = await query;

    if (donorsError) {
        console.error('Error fetching potential donors:', donorsError);
        return NextResponse.json({ error: 'Failed to fetch potential donors' }, { status: 500 });
    }

    // 3. Implementasi algoritma pencocokan dasar & GAKIN priority boost
    const matches = potentialDonors
        .map(donor => {
            let match_score = 0;
            let estimated_aid_value = 'Akan ditentukan'; // Placeholder

            // Prioritaskan donatur di lingkungan yang sama
            if (user_lingkungan_id && donor.profiles && donor.profiles.lingkungan_id === user_lingkungan_id) {
                match_score += 0.3; // Boost for local donors
            }

            // Tambahkan boost untuk GAKIN jika berlaku
            if (priority_boost_applied && donor.is_emergency_donor) { // Prioritaskan emergency donor untuk GAKIN critical
                 match_score += 0.4;
            } else if (priority_boost_applied) {
                match_score += 0.2; // General boost for GAKIN needs
            }


            // Tambahkan faktor urgensi
            if (urgency === 'critical') match_score += 0.3;
            else if (urgency === 'high') match_score += 0.2;
            else if (urgency === 'medium') match_score += 0.1;

            // Pastikan skor tidak melebihi 1.0
            match_score = Math.min(1.0, match_score);

            return {
                match_id: `match-${crypto.randomUUID()}`,
                donor_id: `encrypted-${donor.profile_id}`, // Enkripsi atau mask ID donor
                match_score: parseFloat(match_score.toFixed(3)),
                estimated_aid_value: estimated_aid_value,
                donor_preferences_matched: donor.preferensi,
                anonymity_note: 'Donor akan diumumkan setelah Anda menerima bantuan'
            };
        })
        .sort((a, b) => b.match_score - a.match_score); // Urutkan berdasarkan skor tertinggi

    return NextResponse.json({
        matches: matches,
        priority_boost_applied: priority_boost_applied,
        total_potential_donors: matches.length
    });
}
