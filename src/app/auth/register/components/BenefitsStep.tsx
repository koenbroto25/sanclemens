'use client';

import { useRegister } from '../RegisterProvider';
import { FONTS } from '../types';
import { PrimaryButton, SecondaryButton } from '../shared/StepHeader';
import { CheckCircle2Icon, HeartIcon, BookIcon, MailIcon, MessageCircleIcon, BriefcaseIcon, GiftIcon, UsersIcon, SunIcon, ShieldIcon, SettingsIcon } from 'lucide-react';

const benefits = [
  { icon: HeartIcon, color: 'var(--color-success, #4a8c5c)', title: 'Pendampingan Iman Pribadi (Klemen Companion)', desc: 'Siap menemani dalam doa, membimbing dalam discernment hidup, dengan privasi E2E encryption.' },
  { icon: BookIcon, color: 'var(--color-gold-deep, #c8a96e)', title: 'Belajar Iman yang Menyenangkan (Learn Catholic)', desc: 'Modul pembelajaran interaktif, dari sumber resmi, bimbingan AI ramah.' },
  { icon: MailIcon, color: 'var(--color-error, #8b2635)', title: 'Surat Pastoral Penuh Rahasia', desc: 'Pesan dan bimbingan langsung dari Pastor Paroki, terenkripsi sepenuhnya.' },
  { icon: MessageCircleIcon, color: 'var(--color-info, #2573b0)', title: 'Bantuan Cepat di Saat Genting (Tiga Pintu Kasih)', desc: 'SOS Darurat dan Pintu Kasih untuk bantuan cepat dan terpercaya.' },
  { icon: BriefcaseIcon, color: 'var(--color-warning, #8b4513)', title: 'Jejaring Solidaritas (Klemen Kerja)', desc: 'Peluang pekerjaan, tawarkan keahlian, jaringan solidaritas ekonomi paroki.' },
  { icon: GiftIcon, color: 'var(--color-error, #8b2635)', title: 'Donasi Penuh Rahmat (Tiga Pintu Kasih)', desc: 'Donasi sukarela transparan, anonim, dikelola ketat, disalurkan dengan prinsip Invisible Grace.' },
  { icon: UsersIcon, color: 'var(--color-info, #2573b0)', title: 'Kartu Keluarga Katolik Digital & Jejaring Komunitas', desc: 'Perkuat tali persaudaraan, data keluarga aman, bagian dari keluarga besar Paroki.' },
  { icon: SunIcon, color: 'var(--color-warning, #ff8c00)', title: 'Perhatian untuk Lansia Kita (Morning Check)', desc: 'Memastikan keselamatan dan kesejahteraan harian para lansia, notifikasi pengingat, jalur eskalasi darurat.' },
  { icon: ShieldIcon, color: 'var(--color-error, #8b2635)', title: 'Lingkungan Paroki yang Bersih & Berintegritas (Whistle-Blower)', desc: 'Laporkan dugaan pelanggaran secara anonim dan aman, langsung kepada Pastor Paroki.' },
  { icon: SettingsIcon, color: 'var(--color-info, #2573b0)', title: 'Manajemen Terpadu untuk Pelayan Gereja', desc: 'Alat manajemen terintegrasi canggih untuk pengurus gereja dan lingkungan (jadwal, kegiatan, verifikasi, keuangan).' },
];

export default function BenefitsStep() {
  const { setPhase } = useRegister();
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: 'rgba(200,169,110,0.15)' }}>
          <CheckCircle2Icon className="h-6 w-6" style={{ color: 'var(--color-gold-deep, #c8a96e)' }} />
        </div>
        <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: FONTS.heading, color: 'var(--color-text-dark, #1a0e05)' }}>Manfaat Data Anda</h2>
        <p className="text-sm" style={{ fontFamily: FONTS.body, color: 'var(--color-stone-dark, #4a3c31)' }}>Pelajari bagaimana data Anda membantu paroki dan umat.</p>
      </div>

      <div className="space-y-4">
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} className="p-4 rounded-lg border" style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(200,169,110,0.2)' }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,169,110,0.15)' }}>
                  <Icon className="h-4 w-4" style={{ color: b.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: FONTS.body, color: 'var(--color-text-dark, #1a0e05)' }}>{b.title}</h3>
                  <p className="text-xs" style={{ fontFamily: FONTS.body, color: 'var(--color-stone, #8b7355)' }}>{b.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <SecondaryButton onClick={() => setPhase('otp')}>Kembali</SecondaryButton>
        <PrimaryButton onClick={() => setPhase('personal_data_verification')}>Lanjutkan Verifikasi Data</PrimaryButton>
      </div>
    </div>
  );
}