#!/usr/bin/env python3
"""
Script untuk menghasilkan CSV per tabel Supabase untuk import.
Membaca data/data_umat/converted_data.json dan menghasilkan:
- data/data_umat/profiles.csv
- data/data_umat/keluarga.csv
- data/data_umat/sakramen_records.csv
"""

import json
import csv
from typing import List, Dict, Any

def json_to_csv(data_list: List[Dict[str, Any]], output_path: str):
    """Konversi list of dicts ke CSV file."""
    if not data_list:
        print(f"Tidak ada data untuk {output_path}")
        return
    
    # Ambil semua keys unik dari semua records
    fieldnames = set()
    for item in data_list:
        fieldnames.update(item.keys())
    fieldnames = list(fieldnames)
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for item in data_list:
            # Convert complex values to string
            row = {}
            for key in fieldnames:
                value = item.get(key)
                if isinstance(value, (list, dict)):
                    row[key] = json.dumps(value, ensure_ascii=False)
                else:
                    row[key] = value if value is not None else ''
            writer.writerow(row)
    
    print(f"✓ {output_path} - {len(data_list)} baris")

def main():
    json_path = 'data/data_umat/converted_data.json'
    
    print(f"Membaca {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("\nMenghasilkan CSV per tabel:")
    
    # Generate CSV untuk setiap tabel yang ada data-nya
    if data.get('umat_staging'):
        json_to_csv(data['umat_staging'], 'data/data_umat/umat_staging.csv')
    if data.get('profiles'):
        json_to_csv(data['profiles'], 'data/data_umat/profiles.csv')
    if data.get('keluarga'):
        json_to_csv(data['keluarga'], 'data/data_umat/keluarga.csv')
    if data.get('sakramen_records'):
        json_to_csv(data['sakramen_records'], 'data/data_umat/sakramen_records.csv')
    
    print("\nSelesai! File CSV siap di-import ke Supabase:")
    print("1. umat_staging.csv (utama)")
    print("2. sakramen_records.csv")
    print("\nImport dengan urutan: umat_staging -> sakramen_records")

if __name__ == '__main__':
    main()