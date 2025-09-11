// Prefer explicit env. Otherwise infer based on current origin with sensible defaults
const inferApiBaseUrl = (): string => {
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) return envUrl;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Netlify or custom domain → use Render by default
    if (host.includes('netlify.app') || host.includes('dataflow')) {
      return 'https://dataflow-1.onrender.com/api';
    }
  }
  // Fallback to local dev
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = inferApiBaseUrl();


