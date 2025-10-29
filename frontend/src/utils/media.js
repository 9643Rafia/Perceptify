const API_BASE =
  (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
  'http://localhost:5000/api';

const DEFAULT_MEDIA_BASE = API_BASE.replace(/\/api\/?$/, '');
const MEDIA_BASE =
  (typeof process !== 'undefined' && process.env.REACT_APP_MEDIA_BASE_URL) ||
  DEFAULT_MEDIA_BASE;

export const resolveMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `http:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${MEDIA_BASE}${trimmed}`.replace(/([^:]\/)\/+/g, '$1');
  }

  return `${MEDIA_BASE}/${trimmed}`.replace(/([^:]\/)\/+/g, '$1');
};

export default resolveMediaUrl;
