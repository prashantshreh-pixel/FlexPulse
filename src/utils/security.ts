const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;
const BASE64_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
export const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_IMAGE_DATA_URI_LENGTH = 2_800_000;

export function sanitizeInput(input: string, maxLength?: number): string {
  if (!input) return '';
  let cleaned = input
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\u2014|\u2013/g, '-');
  if (typeof maxLength === 'number' && maxLength > 0) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

export function sanitizeText(input: string, maxLength?: number): string {
  return sanitizeInput(input, maxLength).trim();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(sanitizeText(username));
}

export function isValidImageSrc(src: string): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (trimmed.length > MAX_IMAGE_DATA_URI_LENGTH) return false;
  if (trimmed.startsWith('data:')) {
    return BASE64_IMAGE_REGEX.test(trimmed);
  }
  if (trimmed.startsWith('https://') || trimmed.startsWith('/images/')) {
    return trimmed.length <= 500;
  }
  return false;
}

export function clampNumber(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(Math.max(val, min), max);
}

export function formatApiError(data: unknown, fallback = 'Request failed. Please try again.'): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string' && record.detail.trim()) {
    return sanitizeText(record.detail, 300);
  }
  const messages: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.length > 0) {
      messages.push(`${field}: ${String(value[0])}`);
    } else if (typeof value === 'string' && value.trim()) {
      messages.push(`${field}: ${value}`);
    }
  }
  return messages.length > 0 ? sanitizeText(messages.join(' | '), 350) : fallback;
}
