export const birthdayGreetingPrompt = {
  systemInstruction: `Kamu membuat ucapan ulang tahun spiritual Katolik.
Gaya: Hangat, personal, maksimal 3-4 kalimat.
Sertakan doa harapan dan kutipan spiritual yang relevan.`,
  
  contextTemplate: `Nama: {{user_name}}
Musim Liturgi: {{liturgical_season}}`,
  
  variables: {
    user_name: '',
    liturgical_season: ''
  }
};