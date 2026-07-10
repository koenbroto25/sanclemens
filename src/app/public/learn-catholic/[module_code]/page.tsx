'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator'; // Assuming a separator component exists
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming a scroll area component exists
import { useAuth } from '@/lib/auth';

interface ModuleContent {
  id: string;
  content_type: 'text' | 'audio' | 'video' | 'quiz' | 'reflection';
  content_data: any; // { title, text, verses, questions, options, answer, prompt }
  sequence_order: number;
}

interface LearningModuleDetail {
  id: string;
  module_code: string;
  title: string;
  description: string;
  difficulty_level: number;
  estimated_duration_minutes: number;
  learning_content: ModuleContent[];
  user_learning_progress?: {
    status: string;
    quiz_score: number | null;
  };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  theological_sources?: string[];
  suggested_questions?: string[];
}

export default function ModuleDetailPage({ params }: { params: { module_code: string } }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); // Client-side auth hook
  const { module_code } = params;

  const [module, setModule] = useState<LearningModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<any>(null); // Full progress object from API

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function fetchModuleAndProgress() {
      setLoading(true);
      setError(null);
      try {
        // Fetch module details with content
        const moduleRes = await fetch(`/api/learn-catholic/modules?module_code=${module_code}&include_content=true`);
        if (!moduleRes.ok) {
          throw new Error('Failed to fetch module details.');
        }
        const moduleData = await moduleRes.json();
        setModule(moduleData.data);

        // Fetch user progress if authenticated
        if (isAuthenticated) {
          const progressRes = await fetch(`/api/learn-catholic/progress`);
          if (!progressRes.ok) {
            throw new Error('Failed to fetch user progress.');
          }
          const progressData = await progressRes.json();
          const moduleProgress = progressData.data.find((p: any) => p.module_id === moduleData.data.id);
          setUserProgress(moduleProgress);
          // Set initial content index based on progress
          if (moduleProgress && moduleProgress.current_content_index !== undefined) {
            setCurrentContentIndex(moduleProgress.current_content_index);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) { // Only fetch once auth status is known
      fetchModuleAndProgress();
    }
  }, [module_code, isAuthenticated, authLoading]);

  const handleNextContent = async () => {
    if (!module) return;
    const nextIndex = currentContentIndex + 1;
    if (nextIndex < module.learning_content.length) {
      setCurrentContentIndex(nextIndex);
      // Update progress if authenticated
      if (isAuthenticated) {
        await updateProgress('in_progress', nextIndex);
      }
    } else {
      // Module completed
      if (isAuthenticated) {
        await updateProgress('completed');
      }
      alert('Modul selesai!'); // TODO: Show completion screen
    }
  };

  const handlePrevContent = async () => {
    if (currentContentIndex > 0) {
      const prevIndex = currentContentIndex - 1;
      setCurrentContentIndex(prevIndex);
      if (isAuthenticated) {
        await updateProgress('in_progress', prevIndex);
      }
    }
  };

  const updateProgress = async (status: string, contentIndex?: number) => {
    if (!user?.id || !module?.id) return;

    const res = await fetch('/api/learn-catholic/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_id: module.id,
        status,
        current_content_index: contentIndex, // Store current content index
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserProgress(data.data);
    } else {
      console.error('Failed to update progress');
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const newMessage: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/learn-catholic/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: chatInput,
          module_id: module?.id,
          current_content_id: module?.learning_content[currentContentIndex]?.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get bot response.');
      }
      const data = await res.json();
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response,
        theological_sources: data.theological_sources,
        suggested_questions: data.suggested_questions,
      };
      setChatMessages(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="container mx-auto p-4 text-center">Memuat modul...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!module) {
    return <div className="container mx-auto p-4 text-center">Modul tidak ditemukan.</div>;
  }

  const currentContent = module.learning_content[currentContentIndex];

  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
      {/* Main Content Area */}
      <div className="lg:w-2/3">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/learn-catholic">â† Kembali ke Daftar Modul</Link>
        </Button>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{module.title}</CardTitle>
            <CardDescription>{module.description}</CardDescription>
            {isAuthenticated && userProgress && (
              <div className="mt-2">
                <Progress value={(currentContentIndex / module.learning_content.length) * 100} className="w-full" />
                <p className="text-sm text-gray-600 mt-1">
                  Progress: {Math.round((currentContentIndex / module.learning_content.length) * 100)}% ({currentContentIndex + 1}/{module.learning_content.length})
                </p>
                <p className="text-sm font-medium">Status: {userProgress.status}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {currentContent && currentContent.content_type === 'text' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">{currentContent.content_data.title}</h3>
                <p className="text-gray-700">{currentContent.content_data.text}</p>
                {currentContent.content_data.verses && currentContent.content_data.verses.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500 italic">
                    Sumber Kitab Suci: {currentContent.content_data.verses.join(', ')}
                  </div>
                )}
                {currentContent.content_data.references && currentContent.content_data.references.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500 italic">
                    Referensi Katekismus/KHK: {currentContent.content_data.references.join(', ')}
                  </div>
                )}
              </div>
            )}
            {currentContent && currentContent.content_type === 'quiz' && (
              <Card>
                <CardHeader><CardTitle>{currentContent.content_data.question}</CardTitle></CardHeader>
                <CardContent>
                  {currentContent.content_data.options.map((option: string, idx: number) => (
                    <Button key={idx} variant="outline" className="w-full justify-start mb-2">
                      {option}
                    </Button>
                  ))}
                  {/* TODO: Implement quiz answer submission logic */}
                </CardContent>
              </Card>
            )}
            {currentContent && currentContent.content_type === 'reflection' && (
                <Card>
                    <CardHeader><CardTitle>Renungan</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4">{currentContent.content_data.prompt}</p>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={4}
                            placeholder="Tulis renungan Anda di sini..."
                        ></textarea>
                        <Button className="mt-2">Simpan Renungan</Button>
                    </CardContent>
                </Card>
            )}
            {/* TODO: Add audio/video content types */}
          </CardContent>
          <CardFooter className="flex justify-between mt-4">
            <Button onClick={handlePrevContent} disabled={currentContentIndex === 0} variant="outline">
              Sebelumnya
            </Button>
            <Button onClick={handleNextContent}>
              {currentContentIndex === module.learning_content.length - 1 ? 'Selesai Modul' : 'Selanjutnya'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Bot 8 Chat Panel */}
      <div className="lg:w-1/3">
        <Card className="sticky top-4 h-[calc(100vh-100px)] flex flex-col">
          <CardHeader>
            <CardTitle>Bot 8: Asisten Belajar Katolik</CardTitle>
            <CardDescription>Tanyakan apa pun tentang modul ini atau iman Katolik.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.theological_sources && msg.theological_sources.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                            Sumber: {msg.theological_sources.join(', ')}
                        </div>
                    )}
                    {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold">Pertanyaan Saran:</p>
                            <ul>
                                {msg.suggested_questions.map((q, i) => <li key={i}>- {q}</li>)}
                            </ul>
                        </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800 animate-pulse">
                    Mengetik...
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleChatSubmit} className="flex w-full space-x-2">
              <Input
                placeholder="Tanyakan sesuatu..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <Button type="submit" disabled={!chatInput.trim() || chatLoading}>
                Kirim
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}