cd D:\paroki_digital_stclemens
$path = "src\app\api\renungan\generate\route.ts"
$content = Get-Content $path -Raw

# 1a. Ganti baris inisialisasi genai tunggal jadi pool rotasi key
$old1a = "const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);"
$new1a = @'
function loadGeminiApiKeys(): string[] {
  const keys: string[] = [];
  let i = 1;
  while (true) {
    const k = process.env[`GOOGLE_API_KEY_${i}`];
    if (!k) break;
    keys.push(k);
    i++;
  }
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  if (keys.length === 0) {
    throw new Error('Tidak ada GOOGLE_API_KEY_N atau GEMINI_API_KEY di environment');
  }
  return keys;
}
const GEMINI_KEYS = loadGeminiApiKeys();
let geminiKeyIndex = 0;
function nextGenAI(): GoogleGenerativeAI {
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return new GoogleGenerativeAI(key);
}
'@

$countBefore = ([regex]::Matches($content, [regex]::Escape($old1a))).Count
if ($countBefore -eq 1) {
    $content = $content.Replace($old1a, $new1a)
    Write-Host "[OK] 1a. Pool rotasi key ditambahkan (menggantikan inisialisasi genai tunggal)"
} else {
    Write-Host "[GAGAL] 1a. Ditemukan $countBefore kecocokan (harus persis 1) -- cek manual"
}

# 1b. Hapus baris module-level geminiModel lama (akan dibuat ulang per-attempt di loop)
$old1b = "const geminiModel = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });"
$countBefore1b = ([regex]::Matches($content, [regex]::Escape($old1b))).Count
if ($countBefore1b -eq 1) {
    $content = $content.Replace($old1b, "// geminiModel sekarang dibuat ulang tiap attempt di dalam loop retry (lihat di bawah) -- lihat rotasi key")
    Write-Host "[OK] 1b. Baris geminiModel module-level lama dihapus/diberi komentar"
} else {
    Write-Host "[GAGAL] 1b. Ditemukan $countBefore1b kecocokan (harus persis 1) -- cek manual"
}

# 2. Embedding call -- pakai rotasi (SUDAH BERHASIL di run sebelumnya, cek idempotent)
$old2 = "const embeddingModel = genai.getGenerativeModel({ model: 'models/gemini-embedding-2' });"
if ($content.Contains($old2)) {
    $content = $content.Replace($old2, "const embeddingModel = nextGenAI().getGenerativeModel({ model: 'models/gemini-embedding-2' });")
    Write-Host "[OK] 2. Embedding call pakai rotasi"
} else {
    Write-Host "[INFO] 2. Sudah dipatch sebelumnya (pattern lama tidak ketemu lagi) -- OK, dilewati"
}

# 3. Loop retry -- tambahkan pembuatan geminiModel baru (key baru) tiap attempt
# Anchor SATU baris saja ("attempt++;") supaya tidak kena masalah CRLF/LF
$old3 = "attempt++;"
$countBefore3 = ([regex]::Matches($content, [regex]::Escape($old3))).Count
if ($countBefore3 -eq 1) {
    $new3 = "attempt++;`r`n      const geminiModel = nextGenAI().getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });"
    $content = $content.Replace($old3, $new3)
    Write-Host "[OK] 3. Rotasi key per-attempt ditambahkan di loop generate"
} else {
    Write-Host "[GAGAL] 3. Ditemukan $countBefore3 kecocokan 'attempt++;' (harus persis 1) -- cek manual, mungkin sudah dipatch atau ada baris lain serupa"
}

[System.IO.File]::WriteAllText("$PWD\$path", $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "--- Verifikasi ---"
Select-String -Path $path -Pattern "nextGenAI|loadGeminiApiKeys|GEMINI_KEYS|const geminiModel"
