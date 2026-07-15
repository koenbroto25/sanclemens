const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Daftar ekstensi file yang akan diperiksa
const extensionsToFix = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.jsonl',
  '.md', '.sql', '.css', '.py', '.txt', '.html',
  '.mjs', '.cjs', '.toml', '.yaml', '.yml'
];

// Daftar direktori yang akan dilewati
const dirsToSkip = ['node_modules', '.git', '.next', 'build', 'dist', '__pycache__'];

// Karakter mojibake yang sering muncul dan koreksinya
const mojibakePatterns = [
  { pattern: /é/g, replacement: 'é' },
  { pattern: /á/g, replacement: 'á' },
  { pattern: /à/g, replacement: 'à' },
  { pattern: /â/g, replacement: 'â' },
  { pattern: /í/g, replacement: 'í' },
  { pattern: /ä/g, replacement: 'ä' },
  { pattern: /ç/g, replacement: 'ç' },
  { pattern: /è/g, replacement: 'è' },
  { pattern: /ê/g, replacement: 'ê' },
  { pattern: /ë/g, replacement: 'ë' },
  { pattern: /ì/g, replacement: 'ì' },
  { pattern: /í/g, replacement: 'í' },
  { pattern: /î/g, replacement: 'î' },
  { pattern: /ï/g, replacement: 'ï' },
  { pattern: /ð/g, replacement: 'ð' },
  { pattern: /ñ/g, replacement: 'ñ' },
  { pattern: /ò/g, replacement: 'ò' },
  { pattern: /ó/g, replacement: 'ó' },
  { pattern: /ô/g, replacement: 'ô' },
  { pattern: /õ/g, replacement: 'õ' },
  { pattern: /ö/g, replacement: 'ö' },
  { pattern: /ø/g, replacement: 'ø' },
  { pattern: /ù/g, replacement: 'ù' },
  { pattern: /ú/g, replacement: 'ú' },
  { pattern: /û/g, replacement: 'û' },
  { pattern: /ü/g, replacement: 'ü' },
  { pattern: /ý/g, replacement: 'ý' },
  { pattern: /þ/g, replacement: 'þ' },
  { pattern: /ÿ/g, replacement: 'ÿ' },
  { pattern: /©/g, replacement: '©' },
  { pattern: /®/g, replacement: '®' },
  { pattern: /°/g, replacement: '°' },
  { pattern: /±/g, replacement: '±' },
  { pattern: /µ/g, replacement: 'µ' },
  { pattern: /·/g, replacement: '·' },
  { pattern: /¿/g, replacement: '¿' },
  { pattern: /¡/g, replacement: '¡' },
  { pattern: /À/g, replacement: 'À' },
  { pattern: /Á/g, replacement: 'Á' },
  { pattern: /Á‚/g, replacement: 'Â' },
  { pattern: /Áƒ/g, replacement: 'Á' },
  { pattern: /Á„/g, replacement: 'Ä' },
  { pattern: /Á…/g, replacement: 'Å' },
  { pattern: /Á†/g, replacement: 'Æ' },
  { pattern: /Á‡/g, replacement: 'Ç' },
  { pattern: /Áˆ/g, replacement: 'È' },
  { pattern: /Á‰/g, replacement: 'É' },
  { pattern: /ÁŠ/g, replacement: 'Ê' },
  { pattern: /Á‹/g, replacement: 'Ë' },
  { pattern: /Á/g, replacement: 'Ì' },
  { pattern: /Á/g, replacement: 'Í' },
  { pattern: /Á/g, replacement: 'Î' },
  { pattern: /Á/g, replacement: 'Ï' },
  { pattern: /Á/g, replacement: 'Ð' },
  { pattern: /Á/g, replacement: 'Ñ' },
  { pattern: /Á/g, replacement: 'Ò' },
  { pattern: /Á/g, replacement: 'Ó' },
  { pattern: /Á/g, replacement: 'Ô' },
  { pattern: /Á/g, replacement: 'Õ' },
  { pattern: /Á/g, replacement: 'Ö' },
  { pattern: /Á/g, replacement: '×' },
  { pattern: /Á/g, replacement: 'Ø' },
  { pattern: /Á/g, replacement: 'Ù' },
  { pattern: /Á/g, replacement: 'Ú' },
  { pattern: /Á/g, replacement: 'Û' },
  { pattern: /Á/g, replacement: 'Ü' },
  { pattern: /Á/g, replacement: 'Ý' },
  { pattern: /Á/g, replacement: 'Þ' },
  { pattern: /Á/g, replacement: 'ß' },
  { pattern: /Á/g, replacement: 'à' },
  { pattern: /á/g, replacement: 'á' },
  { pattern: /â/g, replacement: 'â' },
  { pattern: /í/g, replacement: 'í' },
  { pattern: /ä/g, replacement: 'ä' },
  { pattern: /Á¥/g, replacement: 'å' },
  { pattern: /Á¦/g, replacement: 'æ' },
  { pattern: /ç/g, replacement: 'ç' },
  { pattern: /è/g, replacement: 'è' },
  { pattern: /é/g, replacement: 'é' },
  { pattern: /ê/g, replacement: 'ê' },
  { pattern: /ë/g, replacement: 'ë' },
  { pattern: /ì/g, replacement: 'ì' },
  { pattern: /Á/gi, replacement: 'í' },
  { pattern: /î/g, replacement: 'î' },
  { pattern: /ï/g, replacement: 'ï' },
  { pattern: /ð/g, replacement: 'ð' },
  { pattern: /ñ/g, replacement: 'ñ' },
  { pattern: /ò/g, replacement: 'ò' },
  { pattern: /ó/g, replacement: 'ó' },
  { pattern: /ô/g, replacement: 'ô' },
  { pattern: /õ/g, replacement: 'õ' },
  { pattern: /ö/g, replacement: 'ö' },
  { pattern: /Á·/g, replacement: '÷' },
  { pattern: /ø/g, replacement: 'ø' },
  { pattern: /ù/g, replacement: 'ù' },
  { pattern: /ú/g, replacement: 'ú' },
  { pattern: /û/g, replacement: 'û' },
  { pattern: /ü/g, replacement: 'ü' },
  { pattern: /ý/g, replacement: 'ý' },
  { pattern: /þ/g, replacement: 'þ' },
  { pattern: /ÿ/g, replacement: 'ÿ' }
];

function hasMojibake(text) {
  // Check if text contains common mojibake patterns
  return mojibakePatterns.some(({ pattern }) => pattern.test(text));
}

function fixMojibake(text) {
  let fixed = text;
  for (const { pattern, replacement } of mojibakePatterns) {
    fixed = fixed.replace(pattern, replacement);
  }
  return fixed;
}

function fixFile(filePath) {
  try {
    // Read file as buffer
    const buffer = fs.readFileSync(filePath);
    
    // Try to decode as UTF-8 first
    let text;
    try {
      text = buffer.toString('utf-8');
    } catch (e) {
      // If UTF-8 fails, try Windows-1252
      text = iconv.decode(buffer, 'win1252');
    }
    
    // Check if file has mojibake
    if (!hasMojibake(text)) {
      return false;
    }
    
    // Fix mojibake
    const fixedText = fixMojibake(text);
    
    // Write back as UTF-8
    fs.writeFileSync(filePath, fixedText, 'utf-8');
    console.log(`Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir, depth = 0) {
  if (depth > 20) return; // Prevent infinite recursion
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip directories that should not be processed
        if (dirsToSkip.includes(item)) {
          continue;
        }
        processDirectory(fullPath, depth + 1);
      } else if (stat.isFile()) {
        // Check if file extension should be processed
        const ext = path.extname(item).toLowerCase();
        if (extensionsToFix.includes(ext)) {
          fixFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

// Process multiple root directories
const directoriesToProcess = [
  './src',
  './data',
  './docs',
  './migrations',
  './scripts',
  './packages',
  './supabase',
  './public',
  './v5',
  './api source'
];

console.log('Starting encoding fix...\n');

directoriesToProcess.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Processing directory: ${dir}`);
    processDirectory(dir);
  }
});

// Also process files in root directory
console.log('\nProcessing root directory files...');
try {
  const rootFiles = fs.readdirSync('.');
  for (const file of rootFiles) {
    const fullPath = path.join('.', file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (extensionsToFix.includes(ext)) {
        fixFile(fullPath);
      }
    }
  }
} catch (error) {
  console.error('Error processing root directory:', error.message);
}

console.log('\nEncoding fix completed!');