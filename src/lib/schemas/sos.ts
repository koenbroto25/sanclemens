import { z } from 'zod';

export const sosTriggerSchema = z.object({
  sos_type: z.enum(['pengurapan', 'konseling_darurat', 'konsultasi_pastoral', 'kematian_darurat', 'lainnya'], {
    error: 'Jenis kedaruratan wajib dipilih.',
  }),
  deskripsi: z.string().min(10, 'Deskripsi kedaruratan minimal 10 karakter.').max(500, 'Deskripsi terlalu panjang.'),
  location_address: z.string().optional(),
  kontak_keluarga: z.string().optional(), // Consider more robust phone number validation if needed
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
});

export type SOSTriggerPayload = z.infer<typeof sosTriggerSchema>;
