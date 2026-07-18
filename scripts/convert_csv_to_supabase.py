#!/usr/bin/env python3
"""
Script untuk mengonversi data_umat_supabase.csv ke format yang sesuai dengan skema Supabase (sesuai skema aktual di migration 060 & 026).
Data akan dipecah menjadi beberapa tabel: profiles, keluarga, sakramen_records, umat_details.
"""

import csv
import json
from datetime import datetime
from typing import Dict, List, Any

# Skema aktual tabel di Supabase (berdasarkan tabel umat_staging)
# Mapping: nama_tabel -> {nama_kolom_supabase: nama_kolom_csv}
TABLES = {
    'umat_staging': {
        # Identitas
        'nama': 'nama',
        'nama_baptis': 'nama_baptis',
        'jenis_kelamin': 'jenis_kelamin',  # L/P
        'tempat_tanggal_lahir': 'tempat_tanggal_lahir',
        'tanggal_lahir': 'tanggal_lahir',
        'golongan_darah': 'golongan_darah',
        'agama': 'agama',
        'suku': 'suku',
        'status_perkawinan': 'status_perkawinan',
        'nik': 'nik',
        
        # Alamat
        'alamat': 'alamat',
        'kota_kab': 'kota_kab',
        'kecamatan': 'kecamatan',
        'kelurahan': 'kelurahan',
        'wilayah': 'wilayah',
        'lingkungan': 'lingkungan',
        'status_rumah': 'status_rumah',
        
        # Kontak
        'phone': 'handphone_telepon',
        'email': 'email',
        
        # Pendidikan & Pekerjaan
        'pendidikan_terakhir': 'pendidikan_terakhir',
        'pekerjaan': 'pekerjaan',
        'profesi': 'profesi',
        'keterampilan': 'keterampilan',
        
        # Kesehatan & Sosial
        'kondisi_tubuh': 'kondisi_tubuh',
        'status_aktivitas_sosial': 'status_aktivitas_sosial',
        
        # Keluarga
        'no_kk': 'no_kartu_keluarga',
        'hubungan_keluarga': 'hubungan_keluarga',
        
        # Metadata (akan diisi otomatis)
        # id, status, created_at, assigned_role, dll - skip
    }
}

# Kolom yang akan di-skip (tidak ada di tabel atau tidak diinginkan)
SKIP_COLUMNS = {
    'umat_staging': [
        'id',  # Auto-generated UUID
        'status',  # Default 'staging'
        'created_at',  # Default NOW()
        'registered_profile_id',  #null dulu
        'assigned_role',  #null dulu
        'assigned_access_layer',  #null dulu
        'assigned_by',  #null dulu
        'assigned_at',  #null dulu
        'keluarga_id',  #null dulu
        'umur',  #null dulu
        'status_ekonomi',  #null dulu
        'sumber_data_id',  #null dulu
        'sumber_url',  #null dulu
    ],
    'profiles': [],
    'keluarga': [],
    'sakramen_records': []
}

# Metadata tipe data kolom
COLUMN_TYPES = {
    'umat_staging': {
        'keterampilan': 'array',  # TEXT[] -> split by ;
    },
    'profiles': {
        'keterampilan': 'array',  # TEXT[] -> split by ;
    },
    'sakramen_records': {
        'sponsors': 'array',
    }
}

def parse_value(value: str, col_type: str = None) -> Any:
    """Parse nilai dari CSV sesuai tipe yang diharapkan."""
    if not value or not value.strip():
        return None
    
    value = value.strip()
    
    if col_type == 'array':
        # Split by ; atau ,
        items = [item.strip() for item in value.replace(',', ';').split(';') if item.strip()]
        return items if items else None
    
    return value

def parse_date(date_str: str) -> Any:
    """Parse tanggal dari string."""
    if not date_str or not date_str.strip():
        return None
    try:
        # Format bisa: YYYY-MM-DD atau YYYY-MM-DD HH:MM:SS
        date_str = date_str.strip()
        if ' ' in date_str:
            date_str = date_str.split(' ')[0]
        # Parse
        parts = date_str.split('-')
        if len(parts) == 3:
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            return f"{year:04d}-{month:02d}-{day:02d}"
    except:
        pass
    return None

def map_row_to_umat_staging(row: Dict[str, str]) -> Dict[str, Any]:
    """Map satu baris CSV ke dict untuk tabel umat_staging."""
    result = {}
    
    for supabase_col, csv_col in TABLES['umat_staging'].items():
        if supabase_col in SKIP_COLUMNS.get('umat_staging', []):
            continue
        if csv_col in row:
            value = row[csv_col].strip()
            if value:
                # Handle tipe data
                col_type = None
                if 'umat_staging' in COLUMN_TYPES and supabase_col in COLUMN_TYPES['umat_staging']:
                    col_type = COLUMN_TYPES['umat_staging'][supabase_col]
                
                if supabase_col == 'tanggal_lahir':
                    result[supabase_col] = parse_date(value)
                elif supabase_col == 'jenis_kelamin':
                    # Convert PRIA/WANITA to L/P
                    value_upper = value.upper()
                    if value_upper in ['PRIA', 'LAKI-LAKI', 'L', 'MALE']:
                        result[supabase_col] = 'L'
                    elif value_upper in ['WANITA', 'PEREMPUAN', 'P', 'FEMALE']:
                        result[supabase_col] = 'P'
                    else:
                        result[supabase_col] = value[0].upper()  # Take first char as fallback
                elif supabase_col == 'hubungan_keluarga':
                    # Convert to allowed values: 'kepala', 'istri', 'anak', 'anggota'
                    value_lower = value.lower()
                    if value_lower == 'suami':
                        result[supabase_col] = 'kepala'
                    elif value_lower == 'istri':
                        result[supabase_col] = 'istri'
                    elif value_lower == 'anak':
                        result[supabase_col] = 'anak'
                    elif value_lower in ['kepala', 'anggota']:
                        result[supabase_col] = value_lower
                    else:
                        result[supabase_col] = 'anggota'  # Default to 'anggota' for unknown values
                else:
                    result[supabase_col] = parse_value(value, col_type)
    
    # Buang nilai None
    result = {k: v for k, v in result.items() if v is not None}
    
    return result

def map_row_to_sakramen(row: Dict[str, str]) -> List[Dict[str, Any]]:
    """Map sakramen-sakramen dari satu baris CSV ke list of dicts untuk sakramen_records."""
    records = []
    user_id = row.get('id', '').strip()
    
    # Baptis
    if row.get('buku_baptis') or row.get('nomor_baptis') or row.get('tanggal_baptis'):
        rec = {
            'user_id': user_id,
            'sacrament_type': 'baptis',
            'date_received': parse_date(row.get('tanggal_baptis')),
            'paroki_received': row.get('paroki_baptis', '').strip() or None,
            'keuskupan_received': row.get('keuskupan_baptis', '').strip() or None,
            'minister': row.get('yang_membaptis', '').strip() or None,
            'book_number': row.get('nomor_baptis', '').strip() or None,
            'notes': row.get('baptis_gereja', '').strip() or None,
        }
        # sponsors - dari wali_baptis
        wali = row.get('wali_baptis', '').strip()
        if wali:
            rec['sponsors'] = [w.strip() for w in wali.replace(',', ';').split(';') if w.strip()]
        records.append({k: v for k, v in rec.items() if v is not None})
    
    # Komuni Pertama
    if row.get('buku_komuni_pertama') or row.get('nomer_komuni_pertama') or row.get('tanggal_komuni_pertama'):
        rec = {
            'user_id': user_id,
            'sacrament_type': 'komuni_pertama',
            'date_received': parse_date(row.get('tanggal_komuni_pertama')),
            'paroki_received': row.get('paroki_komuni_pertama', '').strip() or None,
            'keuskupan_received': row.get('keuskupan_komuni_pertama', '').strip() or None,
            'book_number': row.get('nomer_komuni_pertama', '').strip() or None,
        }
        records.append({k: v for k, v in rec.items() if v is not None})
    
    # Penguatan
    if row.get('buku_penguatan') or row.get('nomer_penguatan') or row.get('tanggal_penguatan'):
        rec = {
            'user_id': user_id,
            'sacrament_type': 'penguatan',
            'date_received': parse_date(row.get('tanggal_penguatan')),
            'paroki_received': row.get('paroki_penguatan', '').strip() or None,
            'keuskupan_received': row.get('keuskupan_penguatan', '').strip() or None,
            'minister': row.get('yang_memberi_penguatan', '').strip() or None,
            'book_number': row.get('nomer_penguatan', '').strip() or None,
        }
        records.append({k: v for k, v in rec.items() if v is not None})
    
    # Perkawinan
    if row.get('buku_perkawinan') or row.get('nomer_buku_perkawinan') or row.get('tanggal_perkawinan'):
        rec = {
            'user_id': user_id,
            'sacrament_type': 'perkawinan',
            'date_received': parse_date(row.get('tanggal_perkawinan')),
            'paroki_received': row.get('paroki_perkawinan', '').strip() or None,
            'keuskupan_received': row.get('keuskupan_perkawinan', '').strip() or None,
            'book_number': row.get('nomer_buku_perkawinan', '').strip() or None,
            'notes': row.get('jenis_perkawinan', '').strip() or None,
        }
        records.append({k: v for k, v in rec.items() if v is not None})
    
    return records

def convert_csv_to_json(csv_path: str, output_path: str):
    """Konversi CSV ke format JSON yang siap di-import ke Supabase."""
    
    print(f"Membaca file CSV: {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"Total baris: {len(rows)}")
    
    output = {
        'umat_staging': [],
        'sakramen_records': [],
        'profiles': [],
        'keluarga': [],
        'umat_details': []
    }
    
    for idx, row in enumerate(rows, 1):
        if idx % 100 == 0:
            print(f"Memproses baris {idx}...")
        
        # Map ke umat_staging
        staging = map_row_to_umat_staging(row)
        if staging:
            output['umat_staging'].append(staging)
        
        # Map ke sakramen_records (jika dibutuhkan)
        sakramen_list = map_row_to_sakramen(row)
        output['sakramen_records'].extend(sakramen_list)
    
    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\nKonversi selesai!")
    print(f"Umat Staging: {len(output['umat_staging'])}")
    print(f"Sakramen Records: {len(output['sakramen_records'])}")
    print(f"\nOutput disimpan di: {output_path}")

if __name__ == '__main__':
    csv_file = 'data/data_umat/data_umat_supabase.csv'
    output_file = 'data/data_umat/converted_data.json'
    convert_csv_to_json(csv_file, output_file)