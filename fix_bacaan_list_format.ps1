cd D:\paroki_digital_stclemens
$path = "src\app\api\renungan\generate\route.ts"
$content = Get-Content $path -Raw

# 1. Perbaiki tema_retrieval -- .join(' ') pada array objek {reference,text}
$old1 = 'liturgi.bacaan_list.slice(0, 3).join('' '')'
$new1 = 'liturgi.bacaan_list.slice(0, 3).map(b => b.reference).join('' '')'

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "[OK] tema_retrieval diperbaiki"
} else {
    Write-Host "[GAGAL] tema_retrieval tidak ketemu"
}

# 2. Perbaiki blok BACAAN LITURGI -- .join('\n') pada array objek {reference,text}
$old2 = 'liturgi.bacaan_list.join(''\n'')'
$new2 = 'liturgi.bacaan_list.map(b => b.reference + (b.text ? '': '' + b.text : '''')).join(''\n'')'

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "[OK] Blok BACAAN LITURGI diperbaiki"
} else {
    Write-Host "[GAGAL] Blok BACAAN LITURGI tidak ketemu"
}

# 3. Bersihkan mojibake berlapis di komentar "Diambil via search_rag_chunks() ..."
$content = $content -replace '\(Diambil via search_rag_chunks\(\)[^\r\n]*', '(Diambil via search_rag_chunks())'

[System.IO.File]::WriteAllText("$PWD\$path", $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "--- Verifikasi ---"
Select-String -Path $path -Pattern "b.reference|b\.text|search_rag_chunks\(\)\)"
