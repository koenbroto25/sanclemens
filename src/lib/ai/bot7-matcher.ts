/**
 * Bot 7 (Klemen Kerja / Pasar Kasih) - GAKIN Priority Matching & Business Logic
 * Implements:
 * 1. GAKIN-aware priority matching (+0.15 bonus)
 * 2. Privacy filter for contact data (access_level_min = 2)
 * 3. Business/Job/Charity matching helpers
 */

import { createClient } from '@/lib/supabase/server';

// GAKIN priority bonus
export const GAKIN_PRIORITY_BONUS = 0.15;

/**
 * Check if user is marked as GAKIN (Keluarga Akses Kanjungan Iman)
 */
export async function isGakinUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('umat_details')
      .select('economic_details')
      .eq('user_id', userId)
      .single();

    if (error || !data?.economic_details) {
      return false;
    }

    // Check if user is marked as GAKIN in economic_details
    return data.economic_details.is_gakin === true;
  } catch (error) {
    console.error('Error checking GAKIN status:', error);
    return false;
  }
}

/**
 * Apply GAKIN priority bonus to matching score
 * Note: This is internal only - not exposed to other users
 */
export function applyGakinPriority(baseScore: number, isGakin: boolean): number {
  if (!isGakin) {
    return baseScore;
  }

  // Add bonus, but cap at 1.0
  return Math.min(baseScore + GAKIN_PRIORITY_BONUS, 1.0);
}

/**
 * Filter results for public access (access_level 0)
 * Removes/hides contact details and personal information
 */
export function filterPublicResults(
  results: Record<string, any>[],
  userAccessLevel: number
): Record<string, any>[] { // eslint-disable-line
  // If user has access level 2+, show everything
  if (userAccessLevel >= 2) {
    return results;
  }

  // For public access (level 0), filter sensitive fields
  return results.map(result => {
    const filtered = { ...result };

    // Remove contact details for public users
    if (filtered.contact_phone) {
      filtered.contact_phone = '***';
    }
    if (filtered.contact_email) {
      filtered.contact_email = '***';
    }
    if (filtered.address_detail) {
      filtered.address_detail = filtered.address_detail.split(',')[0]; // Only show general area
    }

    return filtered;
  });
}

/**
 * Get matching score components for business/job matching
 * Used for explainability and debugging
 */
export interface MatchingScoreComponents {
  categoryMatch: number;
  locationProximity: number;
  ratingScore: number;
  availabilityScore: number;
  charityDiscount: number;
  gakinBonus?: number;
  finalScore: number;
}

/**
 * Calculate business matching score
 * Category match: 30%
 * Location proximity (GPS): 30%
 * Rating: 20%
 * Availability/delivery: 10%
 * Charity discount: 10%
 */
export function calculateBusinessMatchScore(
  userLocation: { lat: number; lng: number } | null,
  businessCategory: string,
  searchCategory: string,
  businessRating: number | null,
  hasDelivery: boolean,
  hasCharityDiscount: boolean,
  isGakin: boolean
): MatchingScoreComponents {
  // Category match (30%)
  const categoryMatch = businessCategory.toLowerCase() === searchCategory.toLowerCase() ? 0.3 : 0.0;

  // Location proximity (30%) - simplified (in production, use actual distance calculation)
  const locationProximity = userLocation ? 0.3 : 0.0; // Assume 0.3 if location available

  // Rating (20%) - scale rating 1-5 to 0-1
  const ratingScore = businessRating ? (businessRating / 5) * 0.2 : 0.0;

  // Availability/delivery (10%)
  const availabilityScore = hasDelivery ? 0.1 : 0.0;

  // Charity discount (10%)
  const charityDiscount = hasCharityDiscount ? 0.1 : 0.0;

  // Calculate base score
  let finalScore = categoryMatch + locationProximity + ratingScore + availabilityScore + charityDiscount;

  // Apply GAKIN bonus if applicable
  if (isGakin) {
    finalScore = applyGakinPriority(finalScore, true);
  }

  return {
    categoryMatch,
    locationProximity,
    ratingScore,
    availabilityScore,
    charityDiscount,
    gakinBonus: isGakin ? GAKIN_PRIORITY_BONUS : undefined,
    finalScore: Math.min(finalScore, 1.0)
  };
}

/**
 * Calculate charity volunteer matching score
 * Category match + Specialization match: 30%
 * Location proximity: 40%
 * Verification status: 20%
 * Availability: 10%
 */
export function calculateCharityMatchScore(
  volunteerCategory: string,
  neededCategory: string,
  volunteerSpecialization: string,
  volunteerLocation: { lat: number; lng: number } | null,
  userLocation: { lat: number; lng: number } | null,
  isVerified: boolean,
  isAvailable: boolean,
  isGakin: boolean
): MatchingScoreComponents {
  // Category + Specialization match (30%)
  const categoryMatch =
    (volunteerCategory.toLowerCase() === neededCategory.toLowerCase() ? 0.2 : 0.0) +
    (volunteerSpecialization.toLowerCase() === neededCategory.toLowerCase() ? 0.1 : 0.0);

  // Location proximity (40%)
  const locationProximity = volunteerLocation && userLocation ? 0.4 : 0.0; // Simplified

  // Verification status (20%)
  const verificationScore = isVerified ? 0.2 : 0.0;

  // Availability (10%)
  const availabilityScore = isAvailable ? 0.1 : 0.0;

  // Calculate base score
  let finalScore = categoryMatch + locationProximity + verificationScore + availabilityScore;

  // Apply GAKIN bonus if applicable
  if (isGakin) {
    finalScore = applyGakinPriority(finalScore, true);
  }

  return {
    categoryMatch,
    locationProximity,
    ratingScore: verificationScore,
    availabilityScore,
    charityDiscount: 0,
    gakinBonus: isGakin ? GAKIN_PRIORITY_BONUS : undefined,
    finalScore: Math.min(finalScore, 1.0)
  };
}

/**
 * Calculate job matching score
 * Skills matching (Jaccard similarity): 40%
 * Location proximity: 30%
 * GAKIN priority bonus: +0.15 (internal only)
 * Urgency level: 15%
 */
export function calculateJobMatchScore(
  userSkills: string[],
  jobRequiredSkills: string[],
  userLocation: { lat: number; lng: number } | null,
  jobLocation: { lat: number; lng: number } | null,
  urgencyLevel: 'low' | 'medium' | 'high',
  isGakin: boolean
): MatchingScoreComponents {
  // Skills matching (40%) - Jaccard similarity
  const intersection = userSkills.filter(skill => jobRequiredSkills.includes(skill));
  const union = [...new Set([...userSkills, ...jobRequiredSkills])];
  const jaccardSimilarity = union.length > 0 ? intersection.length / union.length : 0;
  const skillsScore = jaccardSimilarity * 0.4;

  // Location proximity (30%)
  const locationProximity = userLocation && jobLocation ? 0.3 : 0.0;

  // Urgency level (15%)
  const urgencyScore = urgencyLevel === 'high' ? 0.15 : urgencyLevel === 'medium' ? 0.1 : 0.05;

  // Calculate base score
  let finalScore = skillsScore + locationProximity + urgencyScore;

  // Apply GAKIN bonus if applicable
  if (isGakin) {
    finalScore = applyGakinPriority(finalScore, true);
  }

  return {
    categoryMatch: skillsScore,
    locationProximity,
    ratingScore: urgencyScore,
    availabilityScore: 0,
    charityDiscount: 0,
    gakinBonus: isGakin ? GAKIN_PRIORITY_BONUS : undefined,
    finalScore: Math.min(finalScore, 1.0)
  };
}

/**
 * Search usaha umat with GAKIN priority and privacy filter
 */
export async function searchUsahaUmat(
  supabase: ReturnType<typeof createClient>,
  params: {
    query: string;
    kategori?: string;
    lokasi?: string;
    user_id?: string;
    user_access_level: number;
    limit?: number;
  }
): Promise<any[]> {
  const { query, kategori, lokasi, user_id, user_access_level, limit = 20 } = params;

  // Check if user is GAKIN
  const isGakin = user_id ? await isGakinUser(supabase, user_id) : false;

  // Build query
  let queryBuilder = supabase
    .from('usaha_umat')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(limit);

  // Filter by category if provided
  if (kategori) {
    queryBuilder = queryBuilder.ilike('kategori', `%${kategori}%`);
  }

  // Filter by location if provided
  if (lokasi) {
    queryBuilder = queryBuilder.ilike('lokasi', `%${lokasi}%`);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    console.error('Error searching usaha umat:', error);
    return [];
  }

  // Apply GAKIN priority scoring and privacy filter
  const resultsWithScores = await Promise.all(
    data.map(async (usaha) => {
      const score = calculateBusinessMatchScore(
        null, // userLocation - will be calculated from user profile
        usaha.kategori,
        kategori || '',
        usaha.rating,
        usaha.has_delivery || false,
        usaha.charity_discount || false,
        isGakin
      );

      return {
        ...usaha,
        match_score: score.finalScore,
        score_components: score
      };
    })
  );

  // Sort by match score (descending)
  resultsWithScores.sort((a, b) => b.match_score - a.match_score);

  // Apply privacy filter for public users
  return filterPublicResults(resultsWithScores, user_access_level);
}

/**
 * Search lowongan kerja with GAKIN priority
 */
export async function searchLowonganKerja(
  supabase: ReturnType<typeof createClient>,
  params: {
    query: string;
    tipe?: string;
    lokasi?: string;
    user_id?: string;
    user_access_level: number;
    limit?: number;
  }
): Promise<any[]> {
  const { query, tipe, lokasi, user_id, user_access_level, limit = 20 } = params;

  // Check if user is GAKIN
  const isGakin = user_id ? await isGakinUser(supabase, user_id) : false;

  // Build query
  let queryBuilder = supabase
    .from('lowongan_kerja')
    .select('*')
    .eq('status', 'open')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Filter by type if provided
  if (tipe) {
    queryBuilder = queryBuilder.eq('tipe', tipe);
  }

  // Filter by location if provided
  if (lokasi) {
    queryBuilder = queryBuilder.ilike('lokasi', `%${lokasi}%`);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    console.error('Error searching lowongan kerja:', error);
    return [];
  }

  // Apply GAKIN priority scoring
  const resultsWithScores = await Promise.all(
    data.map(async (lowongan) => {
      const score = calculateJobMatchScore(
        [], // userSkills - will be fetched from user profile
        lowongan.required_skills || [],
        null, // userLocation
        null, // jobLocation
        lowongan.urgency_level || 'medium',
        isGakin
      );

      return {
        ...lowongan,
        match_score: score.finalScore,
        score_components: score
      };
    })
  );

  // Sort by match score (descending)
  resultsWithScores.sort((a, b) => b.match_score - a.match_score);

  // Apply privacy filter
  return filterPublicResults(resultsWithScores, user_access_level);
}

/**
 * Search charity services (allowed for Bot 3 with strict limit)
 */
export async function searchCharityServices(
  supabase: ReturnType<typeof createClient>,
  params: {
    query: string;
    kategori?: string;
    user_access_level: number;
    limit?: number;
  }
): Promise<any[]> {
  const { query, kategori, user_access_level, limit = 10 } = params;

  // Build query
  let queryBuilder = supabase
    .from('charity_services')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(limit);

  // Filter by category if provided
  if (kategori) {
    queryBuilder = queryBuilder.eq('kategori', kategori);
  }

  // Full-text search
  if (query) {
    queryBuilder = queryBuilder.or(`nama.ilike.%${query}%,deskripsi.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    console.error('Error searching charity services:', error);
    return [];
  }

  // Apply privacy filter
  return filterPublicResults(data, user_access_level);
}