import csv
import re

input_file = 'data_umat-alamat.txt'
output_file = 'database_alamat_balikpapan.csv'

# Fungsi normalisasi RT
def normalize_rt(rt_str):
    if not rt_str: return ""
    # Ekstrak angka dari string RT
    match = re.search(r'RT\.?\s*(\d+)', rt_str, re.IGNORECASE)
    if match:
        rt_num = int(match.group(1))
        return f"RT {rt_num:02d}" # Format RT 01, RT 14, RT 66
    return ""

# Fungsi ekstraksi dan pembersihan alamat
def parse_alamat(alamat_str):
    if not alamat_str or alamat_str.strip() == "":
        return "", "", ""
    
    alamat_str = alamat_str.strip()
    
    # 1. Ekstrak RT dan hapus dari string utama
    rt_match = re.search(r'RT\.?\s*\d+', alamat_str, re.IGNORECASE)
    rt_normalized = normalize_rt(rt_match.group(0)) if rt_match else ""
    alamat_clean = re.sub(r'RT\.?\s*\d+', '', alamat_str, flags=re.IGNORECASE).strip()
    
    # 2. Hapus Nomor Rumah, Blok, dan RW
    alamat_clean = re.sub(r'(No\.?\s*[\w-]+|Blok\s*[\w-]+|RW\.?\s*\d+|Rt/Rw:.*?|RT\.?\s*\d+/\d+)', '', alamat_clean, flags=re.IGNORECASE).strip()
    alamat_clean = re.sub(r'[,\s]+', ' ', alamat_clean).strip() # Bersihkan koma dan spasi berlebih
    
    # 3. Identifikasi Perumahan / Komplek
    perumahan = ""
    perumahan_patterns = [
        r'(Perum(?:ahan)?\s+[^,]+)', r'(Komp(?:lek)?\.?\s+[^,]+)', 
        r'(Cluster\s+[^,]+)', r'(Residence\s+[^,]+)', r'(BDS\s*\d*)', 
        r'(CGS\s*\d*)', r'(Batakan\s+Asri\s*\d*)', r'(Pondok\s+Bukit\s+Lestari)',
        r'(Palm\s+Hills)', r'(Borneo\s+Paradiso)', r'(Her\s+Mandiri)',
        r'(Kartini\s+Residence)', r'(Bpp\s+Regency|Balikpapan\s+Regency)',
        r'(Griya\s+[^,]+)', r'(Bukit\s+Damai\s+[^,]+)', r'(Papan\s+Lestari)',
        r'(Alam\s+Sepinggan\s+Asri)', r'(Sepinggan\s+Asri)', r'(Pelangi\s+Cozy)',
        r'(Taman\s+Intan\s+Griya)', r'(Pesona\s+Bukit\s+Batakan)', r'(Mawija)',
        r'(Rawamangun)', r'(Balikpapan\s+Baru)', r'(Citra\s+Bukit\s+Indah)',
        r'(Bumi\s+Rengganis)', r'(Wahana\s+Asri)', r'(Asmil\s+Wirayudha)',
        r'(Telaga\s+Mas)', r'(Paksi\s+Biru)', r'(Batara\s+\d*)', r'(Puri\s+Kencana)',
        r'(Central\s+Bizpark)', r'(Mulia\s+Regency)', r'(De\s+Green\s+Azarya)',
        r'(Nusa\s+Indah)', r'(Tata\s+Bumi)', r'(Gryia\s+Mulya)', r'(Teritip\s+Mas)',
        r'(Pondok\s+Mentari)', r'(Bukit\s+Batakan\s+Permai)', r'(Bukit\s+Batakan\s+Indah)',
        r'(Bukit\s+Villa\s+Balikpapan)', r'(Regalia\s+Residence)', r'(Batu\s+Ampar\s+Permai)',
        r'(Pesona\s+Alam)', r'(Batakan\s+Mas)', r'(Batakan\s+Housing)', r'(Sepinggan\s+Pratama)'
    ]
    
    for pattern in perumahan_patterns:
        match_perum = re.search(pattern, alamat_clean, re.IGNORECASE)
        if match_perum:
            perumahan = match_perum.group(1).strip()
            # Normalisasi prefix
            if perumahan.lower().startswith('perum '): perumahan = "Perumahan " + perumahan[6:]
            if perumahan.lower().startswith('komp.'): perumahan = "Komplek " + perumahan[5:]
            alamat_clean = alamat_clean.replace(match_perum.group(1), '').strip()
            break

    # 4. Identifikasi Jalan
    jalan = ""
    jalan_match = re.search(r'(Jl\.?|Jalan|Jln\.?)\s+(.+)', alamat_clean, re.IGNORECASE)
    if jalan_match:
        jalan = "Jalan " + jalan_match.group(2).strip()
        # Normalisasi Gang
        jalan = re.sub(r'\bGg\.?\b', 'Gang', jalan, flags=re.IGNORECASE)
        # Normalisasi angka jalan (misal: Topaz IV -> Topaz 4)
        jalan = re.sub(r'\bIV\b', '4', jalan)
        jalan = re.sub(r'\bIII\b', '3', jalan)
        jalan = re.sub(r'\bII\b', '2', jalan)
    else:
        # Jika tidak ada prefix Jl/Jalan, tapi ada nama jalan umum (fallback)
        if any(kw in alamat_clean.lower() for kw in ['mulawarman', 'pemuda', 'iswahyudi', 'haryono', 'sudirman', 'proklamasi', 'pjhi', 'sepinggan', 'telaga mas', 'malioboro', 'pupuk', 'daksa']):
            jalan = "Jalan " + alamat_clean
            jalan = re.sub(r'\bGg\.?\b', 'Gang', jalan, flags=re.IGNORECASE)
            alamat_clean = ""

    # Bersihkan sisa karakter aneh
    jalan = re.sub(r'[,\s]+', ' ', jalan).strip(' ,')
    perumahan = re.sub(r'[,\s]+', ' ', perumahan).strip(' ,')
    
    return jalan, perumahan, rt_normalized

# Proses File
with open(input_file, 'r', encoding='cp1252') as f_in, open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.DictReader(f_in, delimiter='\t')
    writer = csv.DictWriter(f_out, fieldnames=['Kelurahan', 'Nama', 'Nama_Jalan', 'Nama_Perumahan', 'RT', 'Kecamatan', 'Kota'])
    writer.writeheader()
    
    for row in reader:
        # FILTER: Hanya ambil data Kota Balikpapan
        if row['Kota/Kab'].strip() != 'Kota Balikpapan':
            continue
            
        jalan, perumahan, rt = parse_alamat(row['Alamat'])
        
        writer.writerow({
            'Kelurahan': row['Kelurahan'].strip(),
            'Nama_Jalan': jalan,
            'Nama_Perumahan': perumahan,
            'RT': rt,
            'Kecamatan': row['Kecamatan'].strip(),
            'Kota': 'Kota Balikpapan'
        })

print(f"Database berhasil disusun dan disimpan ke {output_file}")