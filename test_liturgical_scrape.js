const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function testScrape() {
  const url = 'https://www.imankatolik.or.id/kalender.php?t=2026&b=07';
  console.log('Fetching:', url);
  
  try {
    const response = await axios.get(url);
    console.log('Status:', response.status);
    console.log('Content length:', response.data.length);
    
    const $ = cheerio.load(response.data);
    
    // Save HTML to file for inspection
    fs.writeFileSync('kalender_output.html', response.data);
    console.log('HTML saved to kalender_output.html');
    
    // Look for k_tbl table
    console.log('\nk_tbl tables:', $('table.k_tbl').length);
    
    if ($('table.k_tbl').length > 0) {
      const firstTable = $('table.k_tbl').first();
      console.log('First k_tbl HTML (first 1000 chars):', firstTable.html()?.substring(0, 1000));
    }
    
    // Search for any elements with liturgical content
    console.log('\nAll unique classes:', [...new Set([...$('[class]').map((i, el) => $(el).attr('class')).get()])].slice(0, 50));
    
    // Look for text containing "Perayaan" or readings
    console.log('\nElements containing "Perayaan":', $('*:contains("Perayaan")').length);
    console.log('Elements containing "Hijau" or "Putih" or "Merah":', $('*:contains("Hijau"), *:contains("Putih"), *:contains("Merah")').length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testScrape();