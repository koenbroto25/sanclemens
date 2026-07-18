cd D:\paroki_digital_stclemens
$path = "src\lib\ai\persona-pater-anton.ts"
$content = Get-Content $path -Raw

# Perbaiki mojibake em dash
$content = $content.Replace("â€”", "-")

# Ganti dua frasa placeholder secara spesifik, bukan seluruh baris
$old1 = "Placeholder: [LINK KS]. Kembali ke salah satu pertanyaan."
$new1 = "SEBUTKAN referensi bacaan secara natural (mis. 'Bacalah Yohanes 6:1-15 secara utuh dari Alkitabmu'), JANGAN tulis kata 'link'. Lalu kembali ke salah satu pertanyaan."

$old2 = "Placeholder: [LINK DOKUMEN]. Simpan satu kalimat."
$new2 = "Sebutkan judul dokumen/riwayat santo terkait tema hari ini kalau relevan, JANGAN tulis kata 'link'. Lalu simpan satu kalimat dari situ."

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "[OK] LINK KS diganti"
} else {
    Write-Host "[GAGAL] LINK KS tidak ketemu"
}

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "[OK] LINK DOKUMEN diganti"
} else {
    Write-Host "[GAGAL] LINK DOKUMEN tidak ketemu"
}

[System.IO.File]::WriteAllText("$PWD\$path", $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "--- Hasil verifikasi ---"
Select-String -Path $path -Pattern "LINK|JANGAN tulis"
