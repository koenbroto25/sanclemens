import pandas as pd
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import dotenv_values

# Load environment variables from .env.local
config = dotenv_values(".env.local")
SUPABASE_URL = config.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = config.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set in .env.local file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Path to your data file
DATA_FILE_PATH = 'data/data_umat/data_umat.txt'

# --- Column Mapping ---
# Map source column names (from data_umat.txt) to target column names (in public.umat_staging)
# Note: "ID" from the file will be ignored as Supabase generates UUIDs
# "Nama" -> full_name, "NIK" -> nik, "Handphone/Telepon" -> nomer_hp_telepon etc.
# The `add_umat_staging_columns.sql` migration file defines the target columns.
# We will explicitly map based on the columns added in the migration.
column_mapping = {
    'Nama': 'full_name',
    'Paroki': 'paroki',
    'Wilayah': 'no_stasi', # Assuming Wilayah maps to no_stasi
    'Lingkungan': 'nama_lingkungan', # Assuming Lingkungan maps to nama_lingkungan
    'No. Kartu Keluarga': 'no_kk',
    'NIK': 'nik',
    'Tempat Lahir': 'place_of_birth',
    'Tanggal Lahir': 'date_of_birth',
    'Jenis Kelamin': 'gender',
    'Golongan Darah': 'blood_type',
    'Suku': 'suku',
    'Hubungan Keluarga': 'status_hubungan_keluarga',
    'Status Perkawinan': 'status_perkawinan',
    'Tanggal Menikah': 'tanggal_menikah',
    'Alamat': 'alamat_lengkap',
    'Kota/Kab': 'kota_domisili',
    'Kecamatan': 'kecamatan',
    'Kelurahan': 'kelurahan',
    'Handphone/Telepon': 'nomer_hp_telepon', # Mapped from previous context
    'Email': 'email',
    'Pendidikan Terakhir': 'pendidikan_terakhir',
    'Pekerjaan': 'pekerjaan',
    'Keterampilan': 'keterampilan', # Assuming this should be an array of texts
    'Kondisi Tubuh': 'kondisi_kesehatan',
    'Status Aktivitas Sosial': 'status_aktivitas_sosial',
    'Update Terakhir': 'update_terakhir',
    'Nama Baptis': 'nama_baptis',
    'Agama': 'agama',
    'Keuskupan Baptis': 'keuskupan_baptis',
    'Paroki Baptis': 'paroki_baptis',
    'Buku Baptis': 'buku_baptis',
    'Nomor Baptis': 'nomor_baptis',
    'Yang Membaptis': 'yang_membaptis',
    'Tanggal Baptis': 'tanggal_baptis',
    'Baptis Gereja': 'gereja_baptis',
    'Wali Baptis': 'wali_baptis',
    'Gereja Protestan': 'gereja_protestan', # New column, assuming text
    'Tanggal Diterima': 'tanggal_diterima', # New column, assuming date
    'Penerima': 'penerima', # New column, assuming text
    'Notanda': 'notanda', # New column, assuming text
    'Buku Komuni Pertama': 'buku_komuni_pertama',
    'Nomer Komuni Pertama': 'nomer_komuni_pertama',
    'Tanggal Komuni Pertama': 'tanggal_komuni_pertama',
    'Keuskupan Komuni Pertama': 'keuskupan_komuni_pertama',
    'Paroki Komuni Pertama': 'paroki_komuni_pertama',
    'Buku Penguatan': 'buku_penguatan',
    'Nomer Penguatan': 'nomer_penguatan',
    'Tanggal Penguatan': 'tanggal_penguatan',
    'Keuskupan Penguatan': 'keuskupan_penguatan',
    'Paroki Penguatan': 'paroki_penguatan',
    'Nama Penguatan': 'nama_penguatan',
    'Yang Memberi Penguatan': 'yang_memberi_penguatan',
    'Buku Perkawinan': 'buku_perkawinan',
    'Nomer Buku Perkawinan': 'nomer_buku_perkawinan',
    'Nama Pasangan': 'nama_pasangan',
    'Tanggal Perkawinan': 'tanggal_perkawinan',
    'Jenis Perkawinan': 'jenis_perkawinan', # New column, assuming text
    'Keuskupan Perkawinan': 'keuskupan_perkawinan',
    'Paroki Perkawinan': 'paroki_perkawinan',
    'Diupdate Oleh': 'updated_by_text',
    'URL': 'url_detail', # Assuming this is a URL field
    'Kota Paroki': 'kota_paroki', # Extracted from the migration file
    'Status Rumah': 'status_rumah', # Extracted from the migration file
    'Fakultas/Jurusan': 'fakultas_jurusan', # Extracted from the migration file
    'Profesi': 'profesi', # Extracted from the migration file
    'Tgl Pindah': 'tgl_pindah', # Extracted from the migration file
    'Asal Paroki': 'asal_paroki', # Extracted from the migration file
    'Tujuan Paroki': 'tujuan_paroki', # Extracted from the migration file
    'No Surat Pindah': 'no_surat_pindah', # Extracted from the migration file
    'Ket Lain': 'ket_lain', # Extracted from the migration file
    'ID': None # Exclude ID as Supabase handles it with UUID
}

# Invert the mapping to get target columns from source columns
reverse_column_mapping = {v: k for k, v in column_mapping.items() if v is not None}

# Columns that should be converted to DATE type
DATE_COLUMNS = [
    'date_of_birth',
    'tanggal_menikah',
    'tanggal_baptis',
    'tanggal_komuni_pertama',
    'tanggal_penguatan',
    'tanggal_perkawinan',
    'tanggal_diterima'
]

# Columns that should be converted to TIMESTAMP WITH TIME ZONE
TIMESTAMP_COLUMNS = [
    'update_terakhir'
]

def parse_date(date_string):
    """
    Parses a date string into 'YYYY-MM-DD' format.
    Handles various date formats found in the data.
    Returns None if parsing fails.
    """
    if pd.isna(date_string) or not isinstance(date_string, str):
        return None
    for fmt in ('%d %B %Y', '%Y-%m-%d', '%d-%m-%Y'): # Add more formats as needed
        try:
            return datetime.strptime(date_string, fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return None

def parse_timestamp(timestamp_string):
    """
    Parses a timestamp string into ISO 8601 format with timezone.
    Returns None if parsing fails.
    """
    if pd.isna(timestamp_string) or not isinstance(timestamp_string, str):
        return None
    # Example format: "Selasa, 21 Maret 2023, 10:18:24"
    # Need to handle Indonesian day and month names
    # A more robust solution might use a library like 'dateparser' or 'babel'
    
    # Simple approach for known format:
    # Remove day of the week, replace month names, then parse
    indonesian_months = {
        'Januari': 'January', 'Februari': 'February', 'Maret': 'March',
        'April': 'April', 'Mei': 'May', 'Juni': 'June', 'Juli': 'July',
        'Agustus': 'August', 'September': 'September', 'Oktober': 'October',
        'November': 'November', 'Desember': 'December'
    }
    
    # Remove day of week (e.g., "Selasa, ")
    parts = timestamp_string.split(', ', 1)
    if len(parts) > 1:
        timestamp_string_no_day = parts[1]
    else:
        timestamp_string_no_day = timestamp_string
        
    for id_month, en_month in indonesian_months.items():
        timestamp_string_no_day = timestamp_string_no_day.replace(id_month, en_month)
        
    for fmt in ('%d %B %Y, %H:%M:%S', '%d %b %Y, %H:%M:%S', '%Y-%m-%d %H:%M:%S%z', '%Y-%m-%d %H:%M:%S'):
        try:
            # Assuming UTC timezone for simplicity if not specified in data
            dt_object = datetime.strptime(timestamp_string_no_day, fmt)
            # Make it timezone-aware (e.g., UTC)
            return dt_object.isoformat(timespec='seconds') + '+08:00' # Assuming Asia/Makassar UTC+8
        except ValueError:
            pass
    return None


def process_keterampilan(keterampilan_string):
    """
    Processes the 'Keterampilan' field.
    Splits by ';' or ',' and returns a list of stripped strings.
    """
    if pd.isna(keterampilan_string) or not isinstance(keterampilan_string, str):
        return []
    
    # Try splitting by semicolon first, then comma if no semicolon
    if ';' in keterampilan_string:
        items = [item.strip() for item in keterampilan_string.split(';') if item.strip()]
    else:
        items = [item.strip() for item in keterampilan_string.split(',') if item.strip()]
    
    return items


def import_data():
    print(f"Loading data from {DATA_FILE_PATH}...")
    # Read the data file, assuming tab-separated as indicated by the column headers
    # and previous context. Using the first line as header.
    df = pd.read_csv(DATA_FILE_PATH, sep='\t', engine='python', encoding='latin-1')

    # Rename columns to match target Supabase table using the mapping
    # Drop columns that are not in the mapping (like 'ID' or extra columns)
    df_mapped = pd.DataFrame()
    for source_col, target_col in column_mapping.items():
        if source_col in df.columns and target_col: # Ensure source column exists and target is not None (i.e. 'ID')
            df_mapped[target_col] = df[source_col]

    print(f"Processing {len(df_mapped)} rows...")

    # Apply data type conversions
    for col in DATE_COLUMNS:
        if col in df_mapped.columns:
            df_mapped[col] = df_mapped[col].apply(parse_date)
            
    for col in TIMESTAMP_COLUMNS:
        if col in df_mapped.columns:
            df_mapped[col] = df_mapped[col].apply(parse_timestamp)

    # Process 'keterampilan' column into an array of texts
    if 'keterampilan' in df_mapped.columns:
        df_mapped['keterampilan'] = df_mapped['keterampilan'].apply(process_keterampilan)
        
    # Handle 'old_id' if needed, otherwise drop it if it's not a target column
    # For this task, we are not preserving old IDs in umat_staging, Supabase generates UUID.

    # Iterate over rows and upsert to Supabase
    total_imported = 0
    errors = []

    for index, row in df_mapped.iterrows():
        data_to_upsert = row.dropna().to_dict() # Only send non-null values

        # Use NIK as the unique identifier for upsert
        # Assuming 'nik' is consistently present and unique for identifying umat.
        # This is critical for preventing duplicates and correctly updating existing records.
        if 'nik' in data_to_upsert and data_to_upsert['nik']:
            try:
                # Upsert based on 'nik'
                # Supabase's upsert acts as an insert if no conflict, or update on conflict.
                # Assuming 'nik' has a unique constraint in public.umat_staging for this to work effectively.
                response = supabase.table('umat_staging').upsert(data_to_upsert, on_conflict='nik').execute()
                
                # Check for errors in the response
                if response.data:
                    total_imported += 1
                elif response.error:
                    errors.append(f"Row {index+2} (NIK: {data_to_upsert.get('nik')}): {response.error.message}")
                    print(f"Error upserting row {index+2}: {response.error.message}")
                else:
                    errors.append(f"Row {index+2} (NIK: {data_to_upsert.get('nik')}): Unknown upsert issue.")
            except Exception as e:
                errors.append(f"Row {index+2} (NIK: {data_to_upsert.get('nik')}): {e}")
                print(f"Exception during upsert for row {index+2}: {e}")
        else:
            errors.append(f"Row {index+2}: Missing NIK, skipping upsert.")
            print(f"Skipping row {index+2} due to missing NIK.")

    print(f"\n--- Import Summary ---")
    print(f"Total rows processed: {len(df_mapped)}")
    print(f"Successfully imported/updated: {total_imported}")
    if errors:
        print(f"Errors encountered: {len(errors)}")
        for error in errors:
            print(f"- {error}")
    else:
        print("No errors encountered.")

if __name__ == "__main__":
    import_data()