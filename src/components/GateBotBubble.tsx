import React, { useState } from 'react';

export function GateBotBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [input, setInput] = useState('');

  const botId = 'gate_bot'; // This bot's ID as per the docs

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const newMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    try {
      const response = await fetch(`/api/bot/${botId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_message: newMessage.text }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.bot_response }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: `Error: ${data.error}` }]);
      }
    } catch (error) {
      console.error("Error sending message to bot:", error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Oops! Terjadi kesalahan saat berkomunikasi dengan bot.' }]);
    }
  };

  return (
    <>
      <div 
        className="fixed bottom-4 right-4 bg-amber-500 rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-white text-3xl">🤖</span>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-4 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col z-50">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold">Gate Bot</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✖
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-200 flex">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-l-lg p-2 text-sm focus:outline-none"
              placeholder="Ketik pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white rounded-r-lg px-4 py-2 text-sm hover:bg-blue-700 focus:outline-none"
            >
              Kirim
            </button>
          </div>
        </div>
      )}
    </>
  );
}