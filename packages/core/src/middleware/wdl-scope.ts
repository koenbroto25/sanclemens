// packages/core/src/middleware/wdl-scope.ts
import { supabaseServer } from '../lib/supabase/server';
import { ForbiddenError } from '../lib/middleware/errors';

interface WdlScopeMatrixEntry {
    allowed: string[];
    description: string;
}

export const WDL_SCOPE_MATRIX: Record<string, WdlScopeMatrixEntry> = {
    'read_profile': {
        allowed: ['GET /api/v1/users/:id'],
        description: 'Baca profil dan data dasar umat yang diwakili'
    },
    'write_kasih': {
        allowed: [
            'POST /api/v1/kasih/satu-klik/request',
            'POST /api/v1/kasih/satu-klik/offer',
            'POST /api/v1/kasih/dana-kasih',
        ],
        description: 'Ajukan atau tawarkan bantuan atas nama umat'
    },
    'write_sakramen_daftar': {
        allowed: [
            'POST /api/v1/sacraments/baptism',
            'POST /api/v1/sacraments/confirmation',
            'POST /api/v1/sacraments/communion',
            'POST /api/v1/sacraments/anointing',
        ],
        description: 'Daftarkan sakramen atas nama umat'
    },
    'read_vault_metadata': {
        allowed: ['GET /api/v1/vault'],
        description: 'Lihat daftar dokumen di Vault (bukan isi file)'
    },
    'write_vault': {
        allowed: ['POST /api/v1/vault'],
        description: 'Upload dokumen ke Vault atas nama umat (konfirmasi umat wajib sebelum eksekusi)'
    },
    'manage_morning_check': {
        allowed: ['POST /api/v1/users/:id/morning-check'],
        description: 'Konfirmasi cek pagi atas nama lansia yang diwakili'
    },
    'receive_notifications': {
        allowed: [],
        description: 'Terima notifikasi yang ditujukan untuk umat (FCM forwarding)'
    },
};

// Helper function to match endpoints
function matchEndpoint(template: string, method: string, path: string): boolean {
    const templateParts = template.split(' ');
    if (templateParts.length !== 2) return false;
    const [templateMethod, templatePath] = templateParts;

    if (templateMethod !== method) return false;

    const regexPath = new RegExp('^' + templatePath.replace(/:id/g, '[^/]+') + '$');
    return regexPath.test(path);
}

// Function to get active WDL consent from Supabase
async function getActiveConsent(wdlUserId: string, targetUserId: string): Promise<any | null> {
    const { data: consent, error } = await supabaseServer
        .from('wdl_consent')
        .select('*')
        .eq('wdl_profile_id', wdlUserId)
        .eq('umat_id', targetUserId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error) {
        console.error('Error fetching active consent:', error);
        return null;
    }
    return consent;
}

// Function to log WDL access to Supabase
export async function logWDLAccess(
    consentId: string,
    wdlId: string,
    umatId: string,
    action: string
): Promise<void> {
    const { error } = await supabaseServer
        .from('wdl_access_log')
        .insert({
            consent_id: consentId,
            wdl_id: wdlId,
            umat_id: umatId,
            action: action,
        });

    if (error) {
        console.error('Error logging WDL access:', error);
    }
}

export async function authorizeWDL(
    wdlUserId: string,
    targetUserId: string,
    method: string,
    path: string
): Promise<boolean> {
    const consent = await getActiveConsent(wdlUserId, targetUserId);
    if (!consent) throw new ForbiddenError('WDL_CONSENT_EXPIRED');

    const hasScope = consent.scope.some((scope: string) => {
        const matrix = WDL_SCOPE_MATRIX[scope];
        return matrix?.allowed.some(endpoint => matchEndpoint(endpoint, method, path));
    });

    if (!hasScope) throw new ForbiddenError('WDL_SCOPE_NOT_ALLOWED');

    await logWDLAccess(consent.id, wdlUserId, targetUserId, `${method} ${path}`);

    return true;
}