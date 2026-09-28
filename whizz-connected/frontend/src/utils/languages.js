// BCP-47 codes used both for Web Speech API (STT/TTS) and translation target labels
export const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'ta-IN', label: 'Tamil' },
];

export const labelForLang = (code) => LANGUAGES.find((l) => l.code === code)?.label || code;
