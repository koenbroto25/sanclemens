'use client';
import { useState } from 'react';

interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
  format?: 'currency' | 'date' | 'text';
}

interface DownloadExcelReportProps {
  data: any[];
  filename: string;
  columns: ColumnConfig[];
  sheetName?: string;
  disabled?: boolean;
}

export default function DownloadExcelReport({
  data,
  filename,
  columns,
  sheetName = 'Sheet1',
  disabled = false
}: DownloadExcelReportProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diunduh');
      return;
    }

    setLoading(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Add header row
      const headerRow = worksheet.addRow(
        columns.map(col => ({ text: col.header, bold: true }))
      );
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Add data rows
      data.forEach((row, index) => {
        const rowData = columns.map(col => {
          let value = row[col.key];

          if (col.format === 'currency') {
            value = typeof value === 'number' ? value : parseFloat(value) || 0;
          } else if (col.format === 'date') {
            value = value ? new Date(value).toLocaleDateString('id-ID') : '';
          } else {
            value = value ?? '';
          }

          return value;
        });

        const excelRow = worksheet.addRow(rowData);

        // Alternate row coloring
        if (index % 2 === 0) {
          excelRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE7E6E6' },
            };
          });
        }

        // Add borders
        excelRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell?.((cell) => {
          const cellLength = cell.value ? String(cell.value).length : 0;
          maxLength = Math.max(maxLength, cellLength);
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob and download
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Gagal mengunduh Excel');
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
      {loading ? 'Mengunduh...' : 'Download Excel'}
    </button>
  );
}