/**
 * API Service for Content Automation System
 * Handles all backend API calls with authentication
 */

import type {
  Product,
  Material,
  Content,
  PublishTask,
  PublishPlatform,
  PublishLog,
  AnalyticsStats,
  ContentPerformance,
  User,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * API request wrapper with authentication
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== Products API ====================

export const productsApi = {
  list: () =>
    apiRequest<Product[]>('/products', {
      method: 'GET',
    }),

  get: (asin: string) =>
    apiRequest<Product>(`/products/${asin}`),

  create: (data: Omit<Product, 'id' | 'createdAt'>) =>
    apiRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (asin: string, data: Partial<Product>) =>
    apiRequest<Product>(`/products/${asin}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (asin: string) =>
    apiRequest<void>(`/products/${asin}`, {
      method: 'DELETE',
    }),
};

// ==================== Materials API ====================

export const materialsApi = {
  list: () =>
    apiRequest<Material[]>('/materials', {
      method: 'GET',
    }),

  collect: (asin: string, sourceTypes: string[]) =>
    apiRequest<{ taskId: string }>('/materials/collect', {
      method: 'POST',
      body: JSON.stringify({ asin, sourceTypes }),
    }),
};

// ==================== Content API ====================

export const contentApi = {
  list: () =>
    apiRequest<Content[]>('/contents', {
      method: 'GET',
    }),

  get: (id: number) =>
    apiRequest<Content>(`/contents/${id}`),

  generate: (data: {
    asin: string;
    contentType: 'blog' | 'social' | 'video' | 'email';
    model: 'claude' | 'gpt4';
  }) =>
    apiRequest<{ taskId: string }>('/contents/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  review: (id: number, action: 'approve' | 'reject' | 'revision', comment?: string) =>
    apiRequest<Content>(`/contents/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    }),

  update: (id: number, data: Partial<Content>) =>
    apiRequest<Content>(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/contents/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== Publish API ====================

export const publishApi = {
  queue: () =>
    apiRequest<PublishTask[]>('/publish/queue'),

  submit: (contentId: number, platforms: string[]) =>
    apiRequest<{ taskId: string }>('/publish/submit', {
      method: 'POST',
      body: JSON.stringify({ contentId, platforms }),
    }),

  retry: (taskId: number) =>
    apiRequest<void>(`/publish/queue/${taskId}/retry`, {
      method: 'POST',
    }),

  platforms: () =>
    apiRequest<PublishPlatform[]>('/publish/platforms'),

  logs: (taskId?: number) =>
    apiRequest<PublishLog[]>(`/publish/logs${taskId ? `?taskId=${taskId}` : ''}`),
};

// ==================== Analytics API ====================

export const analyticsApi = {
  stats: () =>
    apiRequest<AnalyticsStats>('/analytics/stats'),

  contentPerformance: () =>
    apiRequest<ContentPerformance[]>('/analytics/content-performance'),
};

// ==================== Auth API ====================

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
    }),

  me: () =>
    apiRequest<User>('/auth/me'),

  refresh: () =>
    apiRequest<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    }),
};
