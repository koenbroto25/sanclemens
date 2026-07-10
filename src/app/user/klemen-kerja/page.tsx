'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Client-side supabase
import { useAuth } from '@/lib/auth'; // Assuming a useAuth hook for client-side auth
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge'; // Assuming a badge component exists
import { Progress } from '@/components/ui/progress'; // Assuming a progress component exists
import Link from 'next/link';

interface UserProfile {
  id: string;
  full_name: string;
  lingkungan_id: string | null;
  ai_user_profiles: {
    preferred_name: string;
    matching_consent: boolean;
  }[];
  tenaga_kerja: {
    id: string;
    keahlian: string[];
    pengalaman_tahun: number;
    tersedia: boolean;
  }[];
  umat_needs: {
    id: string;
    need_type_array: string[];
    urgency: string;
  }[];
}

interface JobMatch {
  lowongan_id: string;
  match_score: number;
  job_details: {
    title: string;
    description: string;
    budget: string;
    location: string;
    duration: string;
  };
}

interface AssistanceMatch {
  match_id: string;
  donor_id: string; // Masked on client, but API might return sensitive ID
  title?: string;
  description?: string;
  match_score: number;
  estimated_aid_value: string;
  donor_preferences_matched: string[];
  anonymity_note: string;
}

export default function KlemenKerjaDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = createClient(); // Client-side Supabase client

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [jobRecommendations, setJobRecommendations] = useState<JobMatch[]>([]);
  const [assistanceRecommendations, setAssistanceRecommendations] = useState<AssistanceMatch[]>([]);
  
  const [newSkill, setNewSkill] = useState('');
  const [newNeed, setNewNeed] = useState('');
  const [needUrgency, setNeedUrgency] = useState('medium');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile with related AI, tenaga_kerja, and umat_needs data
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            lingkungan_id,
            ai_user_profiles(preferred_name, matching_consent),
            tenaga_kerja(id, keahlian, pengalaman_tahun, tersedia),
            umat_needs(id, need_type_array, urgency)
          `)
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw new Error(profileError.message);
        }
        setProfile(data);

        // Fetch proactive recommendations (jobs, assistance)
        const recommendationsRes = await fetch(`/api/ai/matching/recommendations/${user.id}`); // Assuming this endpoint exists
        if (recommendationsRes.ok) {
            const recData = await recommendationsRes.json();
            setJobRecommendations(recData.jobs || []);
            setAssistanceRecommendations(recData.assistance_available || []);
        } else {
            console.warn('Failed to fetch recommendations.');
        }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, user?.id, authLoading, supabase]);

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !user?.id || !profile?.tenaga_kerja?.[0]?.id) return;

    const currentSkills = profile.tenaga_kerja[0].keahlian || [];
    const updatedSkills = [...currentSkills, newSkill.trim()];

    const { error: updateError } = await supabase
      .from('tenaga_kerja')
      .update({ keahlian: updatedSkills, updated_at: new Date().toISOString() })
      .eq('id', profile.tenaga_kerja[0].id);

    if (updateError) {
      console.error('Error adding skill:', updateError);
      setError('Gagal menambahkan keahlian.');
    } else {
      setProfile(prev => ({
        ...prev!,
        tenaga_kerja: [{ ...prev!.tenaga_kerja[0], keahlian: updatedSkills }],
      }));
      setNewSkill('');
    }
  };

  const handleAddNeed = async () => {
    if (!newNeed.trim() || !user?.id) return;

    // Call API to detect intent and add/update umat_needs
    const res = await fetch('/api/ai/umat-needs/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input_text: newNeed.trim(),
            current_path: '/dashboard/klemen-kerja',
            existing_needs_id: profile?.umat_needs?.[0]?.id, // Pass existing ID if available
        }),
    });

    if (res.ok) {
        const data = await res.json();
        alert(`Kebutuhan terdeteksi: ${data.detected_intents.map((i: any) => i.intent).join(', ')}. Status: ${data.ai_response_summary}`);
        // Refetch profile to get updated umat_needs
        // For simplicity, we might just update client-side or prompt a full refresh
        if (profile) {
            setProfile(prev => ({
                ...prev!,
                umat_needs: [{ 
                    ...prev!.umat_needs?.[0], 
                    need_type_array: data.detected_intents.map((i: any) => i.entities?.need_type || i.intent),
                    urgency: data.detected_intents.find((i: any) => i.urgency)?.urgency || 'medium'
                }]
            }));
        }
        setNewNeed('');
        setNeedUrgency('medium');
    } else {
        const errorData = await res.json();
        console.error('Error adding need:', errorData);
        setError('Gagal menambahkan kebutuhan: ' + (errorData.message || 'Server error.'));
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto p-4 text-center">Memuat dashboard...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 text-center">
        Anda perlu <Link href="/auth/login" className="text-blue-600 hover:underline">login</Link> untuk mengakses Klemen Kerja.
      </div>
    );
  }

  if (!profile) {
      return (
          <div className="container mx-auto p-4 text-center">
              Profil pengguna tidak ditemukan atau belum lengkap. Harap lengkapi profil Anda.
          </div>
      );
  }

  const userAiProfile = profile.ai_user_profiles?.[0];
  const isGakin = profile.umat_needs?.[0]?.urgency === 'critical'; // Simplified check

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Klemen Kerja</h1>
      <p className="text-lg text-gray-600 mb-8">
        Temukan peluang kerja, tawarkan keahlian, atau ajukan bantuan melalui Matching Engine berbasis AI.
      </p>

      {/* User Profile Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profil Anda {userAiProfile?.preferred_name || profile.full_name}</CardTitle>
          <CardDescription>
            Atur keahlian Anda, ajukan kebutuhan, dan kelola preferensi Matching Engine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold">Status Matching AI:</span>
            <Badge variant={userAiProfile?.matching_consent ? 'default' : 'destructive'}>
              {userAiProfile?.matching_consent ? 'Aktif' : 'Nonaktif'}
            </Badge>
            {isGakin && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    ÃƒÂ¢Ã‚Â­Ã‚Â GAKIN Aktif
                </Badge>
            )}
          </div>

          {/* Manage Skills */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Keahlian Anda ({profile.tenaga_kerja?.[0]?.pengalaman_tahun || 0} tahun pengalaman)</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.tenaga_kerja?.[0]?.keahlian.map((skill, index) => (
                <Badge key={index} variant="outline">{skill}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Tambah keahlian baru (mis: Tukang Cat)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <Button onClick={handleAddSkill}>Tambah</Button>
            </div>
          </div>

          {/* Manage Needs */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Kebutuhan Anda</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.umat_needs?.[0]?.need_type_array.map((need, index) => (
                <Badge key={index} variant="secondary">{need} {profile.umat_needs?.[0]?.urgency === 'critical' ? 'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â´' : ''}</Badge>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Jelaskan kebutuhan atau keinginan Anda (mis: butuh sembako, anak sakit biaya sekolah, cari kerja supir)"
                value={newNeed}
                onChange={(e) => setNewNeed(e.target.value)}
              />
              <div className="flex gap-2">
                {/* Simplified urgency selection */}
                <select value={needUrgency} onChange={(e) => setNeedUrgency(e.target.value)} className="p-2 border rounded-md">
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="critical">Darurat</option>
                </select>
                <Button onClick={handleAddNeed}>Ajukan Kebutuhan</Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
            <Link href="/dashboard/settings" className="text-blue-600 hover:underline text-sm">
                Kelola Preferensi AI & Matching Anda
            </Link>
        </CardFooter>
      </Card>

      {/* Job Recommendations */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Rekomendasi Lowongan Kerja untuk Anda</CardTitle>
          <CardDescription>Peluang kerja yang cocok berdasarkan keahlian dan lokasi Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobRecommendations.length > 0 ? (
            jobRecommendations.map((job) => (
              <Card key={job.lowongan_id} className="mb-4">
                <CardHeader>
                  <CardTitle>{job.job_details.title}</CardTitle>
                  <CardDescription>{job.job_details.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={Math.round(job.match_score * 100)} className="w-full mb-2" />
                  <p className="text-sm">Match Score: {Math.round(job.match_score * 100)}%</p>
                  <p className="text-sm">Lokasi: {job.job_details.location}</p>
                  <p className="text-sm">Estimasi Gaji: {job.job_details.budget}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Lihat Detail & Lamar</Button> {/* TODO: Link to job detail page */}
                </CardFooter>
              </Card>
            ))
          ) : (
            <p>Tidak ada rekomendasi lowongan kerja saat ini.</p>
          )}
        </CardContent>
      </Card>

      {/* Assistance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Bantuan Tersedia</CardTitle>
          <CardDescription>Donatur potensial yang bisa membantu kebutuhan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {assistanceRecommendations.length > 0 ? (
            assistanceRecommendations.map((assistance) => (
              <Card key={assistance.match_id} className="mb-4">
                <CardHeader>
                  <CardTitle>{assistance.title}</CardTitle>
                  <CardDescription>{assistance.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Match Score: {Math.round(assistance.match_score * 100)}%</p>
                  <p className="text-sm">Estimasi Bantuan: {assistance.estimated_aid_value}</p>
                  <p className="text-sm italic">{assistance.anonymity_note}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Terima Bantuan</Button> {/* TODO: Implement acceptance flow */}
                </CardFooter>
              </Card>
            ))
          ) : (
            <p>Tidak ada rekomendasi bantuan saat ini.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}