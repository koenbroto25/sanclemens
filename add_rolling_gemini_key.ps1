cd D:\paroki_digital_stclemens
$path = "src\app\api\renungan\generate\route.ts"
$content = Get-Content $path -Raw

# 1. Ganti inisialisasi genai/geminiModel tunggal jadi pool rotasi key
$old1 = @'
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genai.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
'@

$new1 = @'
// ========== GEMINI API KEY POOL (rolling, sama pola dengan pipeline Python) ==========
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

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "[OK] 1. Pool rotasi key ditambahkan"
} else {
    Write-Host "[GAGAL] 1. Pattern inisialisasi genai tidak ketemu"
}

# 2. Embedding call -- pakai rotasi
$old2 = "const embeddingModel = genai.getGenerativeModel({ model: 'models/gemini-embedding-2' });"
$new2 = "const embeddingModel = nextGenAI().getGenerativeModel({ model: 'models/gemini-embedding-2' });"

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "[OK] 2. Embedding call pakai rotasi"
} else {
    Write-Host "[GAGAL] 2. Pattern embedding tidak ketemu"
}

# 3. Loop retry generateContent -- buat geminiModel baru (key baru) tiap attempt
$old3 = @'
      attempt++;
      try {
        const result = await geminiModel.generateContent({
'@

$new3 = @'
      attempt++;
      const geminiModel = nextGenAI().getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
      try {
        const result = await geminiModel.generateContent({
'@

if ($content.Contains($old3)) {
    $content = $content.Replace($old3, $new3)
    Write-Host "[OK] 3. Rotasi key per-attempt di loop generate ditambahkan"
} else {
    Write-Host "[GAGAL] 3. Pattern loop attempt tidak ketemu"
}

[System.IO.File]::WriteAllText("$PWD\$path", $content, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "--- Verifikasi ---"
Select-String -Path $path -Pattern "nextGenAI|loadGeminiApiKeys|GEMINI_KEYS"
