export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check super admin auth
    const isSuperAdmin = request.cookies.get('super_admin_auth')?.value === 'true';
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { setting_type, value } = await request.json();

    // Super admin can update various system settings
    // This is a generic endpoint that can be extended
    switch (setting_type) {
      case 'bot_prompt':
        // Update bot prompts in database or config
        await supabase
          .from('system_settings')
          .upsert({
            key: 'bot_prompt',
            value,
            updated_at: new Date().toISOString(),
          });
        break;

      case 'api_key':
        // Rotate API keys
        await supabase
          .from('system_settings')
          .upsert({
            key: 'api_keys',
            value,
            updated_at: new Date().toISOString(),
          });
        break;

      default:
        return NextResponse.json({ error: 'Setting type tidak dikenali' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil diupdate',
    });
  } catch (error) {
    console.error('Super admin settings error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}