export async function fetchWithTimeout(url, { timeoutMs = 8000, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} von ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}
