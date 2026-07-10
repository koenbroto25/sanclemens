export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Max batch size per request
const MAX_BATCH_SIZE = 100;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check admin permissions (Super Admin only)
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, access_layer, role, full_name')
      .eq('id', (await supabase.auth.getSession()).data.session?.user.id)
      .single();

    if (!adminProfile || adminProfile.access_layer < 10) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin yang bisa melakukan bulk import.' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('csv') as File;
    const lingkungan_slug = formData.get('lingkungan_slug') as string || null;
    const access_layer_param = parseInt(formData.get('access_layer') as string || '2');

    if (!file) {
      return NextResponse.json({ error: 'File CSV harus diupload' }, { status: 400 });
    }

    // Validate access_layer
    if (access_layer_param < 1 || access_layer_param > 10) {
      return NextResponse.json({ error: 'Access layer tidak valid (1-10)' }, { status: 400 });
    }

    // Read CSV file
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'File CSV kosong atau tidak valid' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Required columns
    const requiredColumns = ['fullname', 'phone'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Kolom yang wajib diisi tidak ditemukan: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }

    // Parse rows
    const rows = [];
    const errors = [];
    const successes = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        errors.push({ row: i, error: 'Jumlah kolom tidak sesuai' });
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      // Validate required fields
      if (!row.fullname || !row.phone) {
        errors.push({ row: i, error: 'Nama dan nomor WhatsApp harus diisi', data: row });
        continue;
      }

      // Validate phone format
      let cleanedPhone = row.phone.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '62' + cleanedPhone.slice(1);
      } else if (!cleanedPhone.startsWith('62')) {
        cleanedPhone = '62' + cleanedPhone;
      }

      if (cleanedPhone.length < 10 || cleanedPhone.length > 14) {
        errors.push({ row: i, error: 'Format nomor WhatsApp tidak valid', data: row });
        continue;
      }

      rows.push({
        ...row,
        phone: cleanedPhone,
        rowNumber: i,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ 
        error: 'Tidak ada data valid untuk diimport',
        errors 
      }, { status: 400 });
    }

    if (rows.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ 
        error: `Maksimal ${MAX_BATCH_SIZE} data per batch. File ini contains ${rows.length} data.`,
        total: rows.length,
        maxBatch: MAX_BATCH_SIZE
      }, { status: 400 });
    }

    // Process batch registration
    const results = {
      success: 0,
      failed: 0,
      errors: errors as any[],
      details: [] as any[],
    };

    for (const row of rows) {
      try {
        // Check if phone already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', row.phone)
          .single();

        if (existingUser) {
          results.failed++;
          results.errors.push({ row: row.rowNumber, error: 'No WhatsApp sudah terdaftar', data: row });
          continue;
        }

        // Create auth user (password default: "clemens123" - should be changed on first login)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          phone: row.phone,
          password: 'clemens123', // Default password
          phone_confirm: true,
          user_metadata: { 
            fullName: row.fullname,
            registered_by_admin: true,
            admin_id: adminProfile.id,
            bulk_import: true,
          },
        });

        if (authError) {
          results.failed++;
          results.errors.push({ row: row.rowNumber, error: authError.message, data: row });
          continue;
        }

        // Get lingkungan_id if provided
        let lingkungan_id = null;
        if (lingkungan_slug) {
          const { data: lingkungan } = await supabase
            .from('lingkungan')
            .select('id')
            .eq('slug', lingkungan_slug)
            .single();
          lingkungan_id = lingkungan?.id || null;
        }

        // Create profile
        const profileData: any = {
          id: authData.user.id,
          full_name: row.fullname,
          phone: row.phone,
          role: 'umat',
          access_layer: access_layer_param,
          status: 'active', // Auto-active for bulk import
          lingkungan_id,
          lingkungan_slug,
          registered_by: adminProfile.id,
          registration_method: 'BULK_IMPORT',
        };

        // Add optional fields if present
        if (row.nik) profileData.nik = row.nik;
        if (row.tempat_lahir) profileData.tempat_lahir = row.tempat_lahir;
        if (row.tanggal_lahir) profileData.tanggal_lahir = row.tanggal_lahir;
        if (row.jenis_kelamin) profileData.jenis_kelamin = row.jenis_kelamin;
        if (row.alamat) profileData.alamat = row.alamat;
        if (row.pekerjaan) profileData.pekerjaan = row.pekerjaan;
        if (row.pendidikan) profileData.pendidikan = row.pendidikan;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.failed++;
          results.errors.push({ row: row.rowNumber, error: 'Gagal membuat profil: ' + profileError.message, data: row });
          continue;
        }

        // Create anggota_keluarga if family_id provided
        if (row.family_id) {
          await supabase
            .from('anggota_keluarga')
            .insert({
              keluarga_id: row.family_id,
              profile_id: authData.user.id,
              hubungan: row.hubungan_keluarga || 'anggota',
            });
        }

        results.success++;
        results.details.push({
          row: row.rowNumber,
          userId: authData.user.id,
          name: row.fullname,
          phone: row.phone,
        });

      } catch (error) {
        results.failed++;
        results.errors.push({ row: row.rowNumber, error: 'Terjadi kesalahan: ' + (error as Error).message, data: row });
      }
    }

    // Log bulk import to audit trail
    await supabase.rpc('log_admin_action', {
      p_admin_id: adminProfile.id,
      p_admin_name: adminProfile.full_name,
      p_admin_role: adminProfile.role || 'super_admin',
      p_admin_access_layer: adminProfile.access_layer,
      p_action: 'bulk_import',
      p_action_description: `Bulk import ${rows.length} umat (${results.success} success, ${results.failed} failed)`,
      p_target_type: 'user',
      p_target_id: null,
      p_target_name: `Bulk import ${rows.length} users`,
      p_metadata: {
        total_rows: rows.length,
        success: results.success,
        failed: results.failed,
        lingkungan_slug,
        access_layer: access_layer_param,
        filename: file.name,
      } as any,
      p_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      p_user_agent: request.headers.get('user-agent') || 'unknown',
    } as any);

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
      summary: {
        total: rows.length,
        success: results.success,
        failed: results.failed,
      },
      details: results.details,
      errors: results.errors,
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/**
 * Parse CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * GET endpoint - returns CSV template
 */
export async function GET() {
  const template = `fullname,phone,nik,tempat_lahir,tanggal_lahir,jenis_kelamin,alamat,pekerjaan,pendidikan,lingkungan,family_id,hubungan_keluarga
Bambang Susilo,08123456789,1234567890123456,Balikpapan,1990-05-15,L,Jl. Merdeka No. 123,Supir,SMA,ar,,kepala keluarga
Siti Aminah,08198765432,6543210987654321, Samarinda,1992-08-20,P,Jl. Merdeka No. 123,Ibu Rumah Tangga,S1,ar,,istri`;

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="template-import-umat.csv"',
    },
  });
}