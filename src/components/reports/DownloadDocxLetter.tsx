'use client';
import { useState } from 'react';

interface DownloadDocxLetterProps {
  title: string;
  content: string;
  filename: string;
  author?: string;
  disabled?: boolean;
}

export default function DownloadDocxLetter({
  title,
  content,
  filename,
  author,
  disabled = false
}: DownloadDocxLetterProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!content) {
      alert('Tidak ada konten untuk diunduh');
      return;
    }

    setLoading(true);
    try {
      const docx = await import('docx');
      const { Packer, Paragraph, TextRun, AlignmentType } = docx;
      const Document = (docx as any).Document;
      
      const headerText = 'PAROKI SANTO KLEMENS SEPINGGAN';
      const pageTitle = title;
      const today = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const signature = author || 'Pastor Paroki / Pejabat Berwenang';

      const sections = [{
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          new Paragraph({
            text: headerText,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: headerText, bold: true, size: 14 })],
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),
          new Paragraph({
            text: pageTitle,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: pageTitle, bold: true, size: 28 })],
          }),
          new Paragraph({
            text: '_'.repeat(50),
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: content,
            spacing: { line: 360, after: 400 },
            children: [new TextRun({ text: content, size: 12 })],
          }),
          new Paragraph({ text: '', spacing: { after: 400 } }),
          new Paragraph({
            text: '_'.repeat(50),
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: signature,
            children: [new TextRun({ text: signature, size: 12 })],
          }),
          new Paragraph({
            text: today,
            spacing: { after: 200 },
            children: [new TextRun({ text: today, size: 10 })],
          }),
        ],
      }];

      const doc = new Document({ sections });
      const buffer = await Packer.toBuffer(doc);

      const blob = new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Gagal mengunduh DOCX');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || loading}
      className="btn-primary"
      style={{
        padding: '10px 24px',
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Mengunduh...' : 'Download Surat (DOCX)'}
    </button>
  );
}