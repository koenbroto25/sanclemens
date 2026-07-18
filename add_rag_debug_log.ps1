cd D:\paroki_digital_stclemens
$path = "src\app\api\renungan\generate\route.ts"
$content = Get-Content $path -Raw

$old = 'const kutipanRelevan = await retrieveRenunganContext(tema_retrieval, mode);'
$new = @'
const kutipanRelevan = await retrieveRenunganContext(tema_retrieval, mode);
    console.log(`[RAG DEBUG] tema_retrieval: "${tema_retrieval}"`);
    console.log(`[RAG DEBUG] jumlah kutipan ditemukan: ${kutipanRelevan.length}`);
    kutipanRelevan.forEach((k: any, i: number) => {
      console.log(`[RAG DEBUG] #${i + 1} similarity=${(k.similarity_score * 100).toFixed(1)}% source="${k.source_reference}" content_preview="${(k.content || '').slice(0, 150)}..."`);
    });
'@

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    Write-Host "[OK] Logging debug RAG ditambahkan"
} else {
    Write-Host "[GAGAL] baris tidak ketemu"
}

[System.IO.File]::WriteAllText("$PWD\$path", $content, (New-Object System.Text.UTF8Encoding($false)))

Select-String -Path $path -Pattern "RAG DEBUG"
