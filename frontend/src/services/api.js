/**
 * NewsSense Backend API Client
 * Connects directly to the FastAPI server at /api (proxied via Vite or direct origin)
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchNews({ limit = 20, offset = 0, category = null, source = null, search = null } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit);
  if (offset) params.append('offset', offset);
  if (category && category !== 'All' && category !== 'all') params.append('category', category);
  if (source && source !== 'All' && source !== 'all') params.append('source', source);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${API_BASE}/news?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchArticleById(id) {
  const res = await fetch(`${API_BASE}/news/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch article: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSources() {
  const res = await fetch(`${API_BASE}/news/sources`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sources: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchTopics() {
  const res = await fetch(`${API_BASE}/news/topics`);
  if (!res.ok) {
    throw new Error(`Failed to fetch topics: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function askAI(question, conversationHistory = []) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      conversation_history: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `AI query failed with status ${res.status}`);
  }
  return res.json();
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return { status: 'error' };
    return res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}
