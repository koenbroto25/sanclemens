export type RegistrationPhase =
  | 'lookup'
  | 'suggestions'
  | 'verify_secondary'
  | 'new'
  | 'account_info'
  | 'otp'
  | 'benefits'
  | 'personal_data_verification'
  | 'digital_id_display'
  | 'family_verification'
  | 'ai_matching'
  | 'success';

export interface RegisterFormData {
  nomorKk: string;
  namaLookup: string;
  tanggalLahirInput: string;
  fullName: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  otp: string;
  piduId: string;
  matchedFamily: any;
  matchedUmatStagingData: any;
  selectedUmatStagingId: string | null;
  familyMembers: any[];
  suggestions: any[];
  suggestionMessage: string;
}

export const FONTS = {
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}