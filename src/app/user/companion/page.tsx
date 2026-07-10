'use client';
import { useState } from 'react';

export default function CompanionPage() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{sender:'user'|'bot', text:string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');
    setMessages(prev => [...prev, {sender:'user', text:msg}]);
    setIsLoading(true);
    try {
      // This would integrate with a different bot API, e.g., Bot 3 Companion
      const res = await fetch('/api/bot/companion/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({user_message: msg})
      });
      const data = await res.json();
      setMessages(prev => [...prev, {sender:'bot', text: data?.bot_response || 'Maaf, Companion belum bisa menjawab.'}]);
    } catch {
      setMessages(prev => [...prev, {sender:'bot', text:'Terjadi kesalahan. Silakan coba lagi.'}]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-section">
        <div className="section-header"><h2>Companion Rohani</h2><a href="/dashboard">Kembali</a></div>
        <div style={{maxWidth:'700px', margin:'0 auto'}}>
          <div style={{background:'#fff', borderRadius:'4px 28px 4px 28px', padding:'1.5rem', boxShadow:'var(--shadow-card)', border:'1px solid rgba(200,169,110,0.1)'}}>
            <div style={{height:'300px', overflowY:'auto', marginBottom:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {messages.length === 0 ? (
                <p style={{color:'var(--color-stone)', textAlign:'center', padding:'2rem'}}>
                  🤖 Halo! Saya Companion Rohani Anda.<br/>Saya siap mendengarkan, membimbing doa, atau menjelajahi iman bersama Anda.
                </p>
              ) : (
                messages.map((m, i) => (
                  <div key={i} style={{display:'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'}}>
                    <div style={{maxWidth:'80%', padding:'0.75rem 1rem', borderRadius:'16px', background: m.sender === 'user' ? 'var(--color-gold)' : 'var(--color-cream)', color: m.sender === 'user' ? '#fff' : 'var(--color-text-dark)'}}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {isLoading && <div style={{padding:'0.5rem 0.75rem', color:'var(--color-stone)', fontStyle:'italic'}}>Mengetik...</div>}
            </div>
            <form onSubmit={sendMessage} style={{display:'flex', gap:'0.5rem'}}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isLoading}
                placeholder="Tanyakan atau ceritakan sesuatu..." 
                style={{flex:1, padding:'0.75rem 1rem', borderRadius:'24px', border:'1px solid rgba(200,169,110,0.2)', fontFamily:'var(--font-body)', fontSize:'0.85rem', outline:'none'}}/>
              <button type="submit" disabled={isLoading}
                style={{padding:'0.75rem 1.5rem', borderRadius:'24px', background:'var(--color-gold)', color:'var(--color-primary)', border:'none', fontFamily:'var(--font-body)', fontWeight:600, fontSize:'0.75rem', cursor:'pointer', opacity: isLoading ? 0.5 : 1}}>
                Kirim
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}