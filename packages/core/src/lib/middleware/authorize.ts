// packages/core/src/lib/middleware/authorize.ts
import { NextRequest } from 'next/server';
import { supabaseServer } from '../../lib/supabase/server';
import { ForbiddenError } from './errors';
import { authorizeWDL } from '../../middleware/wdl-scope';

// Function to fetch user profile from Supabase
async function getProfile(userId: string): Promise<any | null> {
    const { data: profile, error } = await supabaseServer
        .from('profiles')
        .select('id, access_layer, status, lingkungan_id, marketplace_role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return profile;
}

// Function to get resource owner ID from request path
function getResourceOwnerId(req: NextRequest): string | undefined {
    const pathname = req.nextUrl.pathname;
    const parts = pathname.split('/');
    // Example: /api/v1/users/:id -> parts[4] is the ID
    // This needs to be robust for various resource types and paths
    if (parts.length > 4 && parts[3] === 'users' && parts[4]) {
        return parts[4];
    }
    // Add more logic here to extract owner IDs from other routes if needed
    return undefined;
}

interface AuthorizeOptions {
    allowSelf?: boolean;
    allowWDL?: boolean;
}

export function authorize(minLayer: number, options?: AuthorizeOptions) {
    return async (req: NextRequest, userId: string) => {
        const profile = await getProfile(userId);

        if (!profile) {
            throw new ForbiddenError('Profile not found or unauthorized');
        }

        if (profile.access_layer >= minLayer) return true;

        if (options?.allowSelf) {
            const resourceOwner = getResourceOwnerId(req);
            if (resourceOwner === userId) return true;
        }

        if (options?.allowWDL && profile.access_layer === 3) { // Layer 3 is WDL
            const targetUserId = getResourceOwnerId(req);
            if (targetUserId) {
                await authorizeWDL(userId, targetUserId, req.method, req.nextUrl.pathname);
                return true;
            }
        }

        throw new ForbiddenError('AUTH_INSUFFICIENT_LAYER');
    };
}