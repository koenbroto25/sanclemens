'use client';
export default function KolekteInputPage() {
  return (
    <div className="admin-container">
      <div className="admin-section">
        <div className="section-header"><h2>Input Data Kolekte</h2><a href="/admin/paroki/dashboard">Kembali</a></div>
        <div className="admin-card">
          <h3>Form Input Kolekte Mingguan/Bulanan</h3>
          <p>Masukkan data kolekte dari setiap misa dan perayaan lainnya.</p>
          <button className="btn-admin-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Input Data
          </button>
        </div>
      </div>
    </div>
  );
}