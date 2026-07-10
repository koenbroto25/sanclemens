import React from 'react';

export function FamilyPanel() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e8e0d5]">
      <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2a1a0e" }}>
        👨‍👩‍👧‍👦 Keluarga Saya
      </h3>
      <p className="text-sm text-gray-600">Placeholder for Family Panel content.</p>
      <div className="mt-4 text-center">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Lihat Keluarga</button>
      </div>
    </div>
  );
}
