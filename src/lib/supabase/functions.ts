import { createClient } from './server';
import { Database } from '@/types/supabase'; // Assuming you have a Supabase database type definition

// --- Helper Functions from v5/backend_v5.md ---

/**
 * Function to check GAKIN priority for a user's family.
 * @param p_user_id The UUID of the user.
 * @returns JSONB object with is_gakin (boolean) and priority_tier (string).
 */
export async function check_gakin_priority(p_user_id: string): Promise<{ is_gakin: boolean; priority_tier: 'standard' | 'elevated' | 'critical' }> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('check_gakin_priority', { p_user_id });

    if (error) {
        console.error('Error in check_gakin_priority RPC:', error);
        return { is_gakin: false, priority_tier: 'standard' };
    }
    return data;
}

/**
 * Function to build AI Request Context for a user.
 * @param p_user_id The UUID of the user.
 * @param p_current_path The current path of the request.
 * @returns JSONB object with user context.
 */
export async function get_ai_request_context(p_user_id: string, p_current_path: string = '/'): Promise<any> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_ai_request_context', { p_user_id, p_current_path });

    if (error) {
        console.error('Error in get_ai_request_context RPC:', error);
        return {};
    }
    return data;
}

// --- Matching Score Calculation Functions ---

/**
 * Calculates a match score between a worker and a job posting.
 * @param worker_id The UUID of the worker.
 * @param job_id The UUID of the job posting.
 * @returns The match score (0-1).
 */
export async function calculate_job_match_score(worker_id: string, job_id: string): Promise<number> {
    const supabase = createClient();

    const { data: worker, error: workerError } = await supabase
        .from('tenaga_kerja')
        .select('*, profiles(lingkungan_id)')
        .eq('id', worker_id)
        .single();

    const { data: job, error: jobError } = await supabase
        .from('lowongan_kerja')
        .select('*, profiles(lingkungan_id)') // Select profiles to get posting user's lingkungan_id
        .eq('id', job_id)
        .single();

    if (workerError || !worker) {
        console.error('Error fetching worker:', workerError);
        return 0;
    }
    if (jobError || !job) {
        console.error('Error fetching job:', jobError);
        return 0;
    }

    let score = 0;

    // 1. Skill Match (40%)
    const jobSkills = job.tags || []; // Assuming job tags represent required skills
    const workerSkills = worker.keahlian || [];
    const commonSkills = jobSkills.filter((skill: string) => workerSkills.includes(skill));
    if (jobSkills.length > 0) {
        score += (commonSkills.length / jobSkills.length) * 0.4;
    }

    // 2. Location Match (30%)
    if (worker.profiles?.lingkungan_id && job.lingkungan_id) {
        if (worker.profiles.lingkungan_id === job.lingkungan_id) {
            score += 0.3; // High boost for same neighborhood
        } else {
            // Placeholder for 'nearby' logic if we had geo-coordinates.
            // For now, if not in the same lingkungan, give a smaller boost if both have a lingkungan_id
            score += 0.1; // Smaller boost for being in the same general area/paroki
        }
    }

    // 3. Urgency (15%) - Assuming urgency is derived from job's created_at and expires_at, or a new 'urgency_level' column
    // For now, a simple proxy: older job with closer expiry gets higher urgency
    const daysUntilExpiry = (new Date(job.expires_at!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 7) score += 0.15; // High urgency
    else if (daysUntilExpiry <= 14) score += 0.10; // Medium urgency
    else if (daysUntilExpiry <= 30) score += 0.05; // Low urgency

    // 4. Worker Availability/Rating (15%)
    if (worker.tersedia) score += 0.05;
    if (worker.rating && worker.rating >= 4.0) score += 0.05;
    if (worker.total_jobs_completed && worker.total_jobs_completed > 5) score += 0.05;


    // 5. GAKIN Priority Boost (applied if worker is GAKIN and job is marked for priority, or if job poster is GAKIN)
    // This part requires checking the job poster's GAKIN status and the worker's.
    // For simplicity, let's assume worker's GAKIN status is checked.
    const workerGakinStatus = await check_gakin_priority(worker.user_id);
    if (workerGakinStatus.is_gakin && job.priority_boost) {
        score += 0.1; // Additional boost for GAKIN worker on priority job
    }
    
    // 6. Success Learning Factor (Placeholder)
    // This would dynamically adjust based on past feedback for similar matches.
    // For example, if workers with similar skills consistently succeed in jobs like this, boost score.
    score += 0.05; // Small initial boost for learning factor

    // Ensure score is between 0 and 1
    return Math.min(1, Math.max(0, parseFloat(score.toFixed(3))));
}

/**
 * Calculates a match score between a needy user and a potential donor.
 * @param user_id The UUID of the user needing assistance.
 * @param donor_id The UUID of the potential donor.
 * @param need_type The type of need (e.g., 'sembako', 'medis').
 * @param urgency The urgency level of the need.
 * @returns The match score (0-1).
 */
export async function calculate_assistance_match_score(
    user_id: string,
    donor_id: string,
    need_type: string,
    urgency: 'low' | 'medium' | 'high' | 'critical'
): Promise<number> {
    const supabase = createClient();

    const { data: needyProfile, error: needyProfileError } = await supabase
        .from('profiles')
        .select('lingkungan_id')
        .eq('id', user_id)
        .single();

    const { data: donor, error: donorError } = await supabase
        .from('donatur_potensial')
        .select('*, profiles(lingkungan_id)')
        .eq('user_id', donor_id)
        .eq('is_active', true)
        .single();

    if (needyProfileError || !needyProfile) {
        console.error('Error fetching needy profile:', needyProfileError);
        return 0;
    }
    if (donorError || !donor) {
        console.error('Error fetching donor:', donorError);
        return 0;
    }

    let score = 0;

    // 1. Preference Match (40%)
    if (donor.preferensi && donor.preferensi.includes(need_type)) {
        score += 0.4;
    }

    // 2. Location Match (30%)
    if (needyProfile.lingkungan_id && donor.profiles?.lingkungan_id) {
        if (needyProfile.lingkungan_id === donor.profiles.lingkungan_id) {
            score += 0.3; // High boost for same neighborhood
        } else {
            // Placeholder for 'nearby' logic if we had geo-coordinates.
            // For now, if not in the same lingkungan, give a smaller boost if both have a lingkungan_id
            score += 0.1; // Smaller boost for being in the same general area/paroki
        }
    }

    // 3. Urgency (20%)
    if (urgency === 'critical') score += 0.2;
    else if (urgency === 'high') score += 0.15;
    else if (urgency === 'medium') score += 0.10;

    // 4. GAKIN Priority Boost (10%)
    const needyGakinStatus = await check_gakin_priority(user_id);
    if (needyGakinStatus.is_gakin) {
        score += 0.1; // Boost for GAKIN beneficiaries
    }
    if (needyGakinStatus.is_gakin && donor.is_emergency_donor && urgency === 'critical') {
        score += 0.1; // Additional boost if GAKIN and emergency donor
    }

    // 5. Success Learning Factor (Placeholder)
    // This would dynamically adjust based on past feedback for similar assistance matches.
    score += 0.05; // Small initial boost for learning factor

    // Ensure score is between 0 and 1
    return Math.min(1, Math.max(0, parseFloat(score.toFixed(3))));
}

/**
 * Function to get liturgical context for a given date.
 * @param p_date The date in 'YYYY-MM-DD' format. Defaults to today if not provided.
 * @returns Liturgical context data (season, readings, color, etc).
 */
export async function get_liturgical_context(p_date?: string): Promise<any> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_liturgical_context', { p_date: p_date || new Date().toISOString().split('T')[0] });
    if (error) {
        console.error('Error in get_liturgical_context RPC:', error);
        return null;
    }
    return data;
}

/**
 * Function to log AI abuse incidents.
 * @param bot_name Name of the bot involved.
 * @param p_user_id The UUID of the user.
 * @param input_text The user's input that triggered the abuse detection.
 * @param action Action taken ('block', 'sanitize', 'emergency', etc).
 * @param reason Reason for the flagged action.
 * @param ai_response The AI's response, if any.
 * @param is_emergency Whether this was flagged as an emergency.
 */
export async function log_ai_abuse(
    bot_name: string,
    p_user_id: string,
    input_text: string,
    action: string,
    reason: string,
    ai_response: string,
    is_emergency: boolean = false
): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('ai_abuse_logs').insert({
        bot_name,
        user_id: p_user_id,
        input_text,
        action,
        reason,
        ai_response,
        is_emergency,
    });
    if (error) {
        console.error('Error logging AI abuse:', error);
    }
}