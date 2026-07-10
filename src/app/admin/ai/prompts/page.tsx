'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Client-side supabase
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label'; // Assuming a label component exists
import { Switch } from '@/components/ui/switch'; // Assuming a switch component exists
import { TableUI as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'; // Assuming dialog components exist

interface AiPrompt {
  id: string;
  bot_code: string;
  prompt_name: string;
  prompt_text: string;
  version: number;
  is_active: boolean;
  is_ab_test: boolean;
  ab_test_percentage: number;
  change_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  performance_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminAiPromptsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [prompts, setPrompts] = useState<AiPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<AiPrompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for dialog
  const [formBotCode, setFormBotCode] = useState('');
  const [formPromptName, setFormPromptName] = useState('');
  const [formPromptText, setFormPromptText] = useState('');
  const [formVersion, setFormVersion] = useState(1);
  const [formIsActive, setFormIsActive] = useState(false);
  const [formIsABTest, setFormIsABTest] = useState(false);
  const [formABTestPercentage, setFormABTestPercentage] = useState(0);
  const [formChangeNotes, setFormChangeNotes] = useState('');

  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      setError(null);
      if (!isAuthenticated || !user?.id) {
        setLoading(false);
        router.push('/unauthorized'); // Redirect if not authenticated
        return;
      }

      // Check admin permissions (access_layer >= 6)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('access_layer')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.access_layer < 6) {
        setError('Access Denied: You do not have sufficient permissions to view this page.');
        setLoading(false);
        router.push('/unauthorized');
        return;
      }

      try {
        const res = await fetch('/api/admin/ai/prompts');
        if (!res.ok) {
          throw new Error('Failed to fetch prompts.');
        }
        const data = await res.json();
        setPrompts(data.data);
      } catch (err: any) {
        console.error('Error fetching prompts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchPrompts();
    }
  }, [isAuthenticated, user?.id, authLoading, router, supabase]);

  const openEditDialog = (prompt: AiPrompt) => {
    setSelectedPrompt(prompt);
    setFormBotCode(prompt.bot_code);
    setFormPromptName(prompt.prompt_name);
    setFormPromptText(prompt.prompt_text);
    setFormVersion(prompt.version);
    setFormIsActive(prompt.is_active);
    setFormIsABTest(prompt.is_ab_test);
    setFormABTestPercentage(prompt.ab_test_percentage);
    setFormChangeNotes(prompt.change_notes || '');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedPrompt(null); // Clear selected prompt for new creation
    setFormBotCode('');
    setFormPromptName('');
    setFormPromptText('');
    setFormVersion(1);
    setFormIsActive(false);
    setFormIsABTest(false);
    setFormABTestPercentage(0);
    setFormChangeNotes('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setError(null);
    setLoading(true);

    const payload = {
      id: selectedPrompt?.id, // Only include ID if updating
      bot_code: formBotCode,
      prompt_name: formPromptName,
      prompt_text: formPromptText,
      version: formVersion,
      is_active: formIsActive,
      is_ab_test: formIsABTest,
      ab_test_percentage: formABTestPercentage,
      change_notes: formChangeNotes,
    };

    try {
      const res = await fetch('/api/admin/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save prompt.');
      }

      // Re-fetch prompts to update the list
      const updatedPromptsRes = await fetch('/api/admin/ai/prompts');
      const updatedPromptsData = await updatedPromptsRes.json();
      setPrompts(updatedPromptsData.data);

      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving prompt:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || loading) {
    return <div className="container mx-auto p-4 text-center">Memuat...</div>;
  }

  if (error && error.includes('Access Denied')) {
    return <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
        <p>{error}</p>
        <Button asChild className="mt-4">
          <Link href="/user">Kembali ke Dashboard</Link>
        </Button>
    </div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Manajemen AI Prompts</h1>
      <p className="text-lg text-gray-600 mb-8">
        Kelola prompt sistem AI untuk berbagai bot. Membutuhkan akses layer 6+ (Admin Paroki/DPP) untuk melihat, 
        dan 7+ (Koordinator Bidang/Wakil Ketua DPP) untuk membuat/mengedit.
      </p>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex justify-end mb-4">
        <Button onClick={openCreateDialog}>Buat Prompt Baru</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar Prompts</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot Code</TableHead>
                  <TableHead>Prompt Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>A/B Test</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">{prompt.bot_code}</TableCell>
                    <TableCell>{prompt.prompt_name}</TableCell>
                    <TableCell>{prompt.version}</TableCell>
                    <TableCell>{prompt.is_active ? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢'}</TableCell>
                    <TableCell>{prompt.is_ab_test ? `ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ (${prompt.ab_test_percentage}%)` : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(prompt)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit Prompt */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedPrompt ? 'Edit Prompt AI' : 'Buat Prompt AI Baru'}</DialogTitle>
            <DialogDescription>
              {selectedPrompt ? 'Sesuaikan detail prompt AI yang sudah ada.' : 'Isi detail untuk prompt AI baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bot_code" className="text-right">
                Bot Code
              </Label>
              <Input
                id="bot_code"
                value={formBotCode}
                onChange={(e) => setFormBotCode(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prompt_name" className="text-right">
                Prompt Name
              </Label>
              <Input
                id="prompt_name"
                value={formPromptName}
                onChange={(e) => setFormPromptName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prompt_text" className="text-right">
                Prompt Text
              </Label>
              <Textarea
                id="prompt_text"
                value={formPromptText}
                onChange={(e) => setFormPromptText(e.target.value)}
                className="col-span-3 min-h-[150px]"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version" className="text-right">
                Version
              </Label>
              <Input
                id="version"
                type="number"
                value={formVersion}
                onChange={(e) => setFormVersion(parseInt(e.target.value))}
                className="col-span-3"
                min="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Aktif
              </Label>
              <Switch
                id="is_active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_ab_test" className="text-right">
                A/B Test
              </Label>
              <Switch
                id="is_ab_test"
                checked={formIsABTest}
                onCheckedChange={setFormIsABTest}
                className="col-span-3"
              />
            </div>
            {formIsABTest && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ab_test_percentage" className="text-right">
                  A/B Test %
                </Label>
                <Input
                  id="ab_test_percentage"
                  type="number"
                  value={formABTestPercentage}
                  onChange={(e) => setFormABTestPercentage(parseInt(e.target.value))}
                  className="col-span-3"
                  min="0"
                  max="100"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="change_notes" className="text-right">
                Catatan Perubahan
              </Label>
              <Textarea
                id="change_notes"
                value={formChangeNotes}
                onChange={(e) => setFormChangeNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}