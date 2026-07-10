import React from 'react';
import { format } from 'date-fns';

interface JobCardProps {
  judul: string;
  tipe_pekerjaan: string; // e.g., "Full-time", "Part-time", "Freelance"
  lokasi: string;
  gaji_range?: string; // e.g., "Rp 3jt - 5jt", "Negotiable"
  deskripsi_singkat: string;
  deadline?: string; // ISO date string
  is_active: boolean;
}

const JobCard: React.FC<JobCardProps> = ({
  judul,
  tipe_pekerjaan,
  lokasi,
  gaji_range,
  deskripsi_singkat,
  deadline,
  is_active,
}) => {
  const isExpired = deadline ? new Date(deadline) < new Date() : false;
  const cardStatusClass = !is_active || isExpired ? 'opacity-60 grayscale' : '';

  return (
    <div className={`pk-card flex flex-col h-full ${cardStatusClass}`}>
      <div className="flex-grow mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-pk-text">{judul}</h3>
          {!is_active && (
            <span className="pk-badge pk-badge-category !bg-red-600 !text-white">Tidak Aktif</span>
          )}
          {isExpired && is_active && (
            <span className="pk-badge pk-badge-category !bg-red-500 !text-white">Expired</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-2 text-sm text-pk-text-muted">
          <span className="pk-badge pk-badge-category">{tipe_pekerjaan}</span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9A1.998 1.998 0 0110 20.9l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            {lokasi}
          </span>
        </div>

        {gaji_range && (
          <p className="text-lg font-semibold text-pk-primary mb-3">{gaji_range}</p>
        )}

        <p className="text-sm text-pk-text-muted mb-4">{deskripsi_singkat}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-pk-border flex justify-between items-center">
        {deadline && !isExpired && (
          <p className="text-xs text-pk-text-muted">Deadline: {format(new Date(deadline), 'dd MMM yyyy')}</p>
        )}
        {deadline && isExpired && (
          <p className="text-xs text-red-500 font-medium">Sudah Lewat Deadline</p>
        )}
        {!deadline && <p className="text-xs text-pk-text-muted">Tanpa Deadline</p>}
        
        <button className="pk-btn-primary px-4 py-2 text-sm">Lihat Detail</button>
      </div>
    </div>
  );
};

export default JobCard;