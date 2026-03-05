/**
 * Custom React Hooks for Content Automation System
 * Provides data fetching with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import {
  productsApi,
  materialsApi,
  contentApi,
  publishApi,
  analyticsApi,
  authApi,
} from './api';
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

// ==================== Generic Fetch Hook ====================

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== Products Hooks ====================

export function useProducts() {
  return useApi<Product[]>(() => productsApi.list(), []);
}

export function useProduct(asin: string) {
  return useApi<Product>(() => productsApi.get(asin), [asin]);
}

// ==================== Materials Hooks ====================

export function useMaterials() {
  return useApi<Material[]>(() => materialsApi.list(), []);
}

export function useCollectMaterials() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const collect = useCallback(async (asin: string, sourceTypes: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await materialsApi.collect(asin, sourceTypes);
      setTaskId(result.taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { collect, loading, error, taskId };
}

// ==================== Content Hooks ====================

export function useContents() {
  return useApi<Content[]>(() => contentApi.list(), []);
}

export function useContent(id: number) {
  return useApi<Content>(() => contentApi.get(id), [id]);
}

export function useGenerateContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const generate = useCallback(
    async (data: {
      asin: string;
      contentType: 'blog' | 'social' | 'video' | 'email';
      model: 'claude' | 'gpt4';
    }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await contentApi.generate(data);
        setTaskId(result.taskId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generate, loading, error, taskId };
}

export function useReviewContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(
    async (
      id: number,
      action: 'approve' | 'reject' | 'revision',
      comment?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        await contentApi.review(id, action, comment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { review, loading, error };
}

// ==================== Publish Hooks ====================

export function usePublishQueue() {
  return useApi<PublishTask[]>(() => publishApi.queue(), []);
}

export function usePublishPlatforms() {
  return useApi<PublishPlatform[]>(() => publishApi.platforms(), []);
}

export function usePublishLogs(taskId?: number) {
  return useApi<PublishLog[]>(
    () => publishApi.logs(taskId),
    [taskId]
  );
}

export function useSubmitPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (contentId: number, platforms: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await publishApi.submit(contentId, platforms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

export function useRetryPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(async (taskId: number) => {
    setLoading(true);
    setError(null);
    try {
      await publishApi.retry(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { retry, loading, error };
}

// ==================== Analytics Hooks ====================

export function useAnalyticsStats() {
  return useApi<AnalyticsStats>(() => analyticsApi.stats(), []);
}

export function useContentPerformance() {
  return useApi<ContentPerformance[]>(
    () => analyticsApi.contentPerformance(),
    []
  );
}

// ==================== Auth Hooks ====================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      setLoading(false);
      return;
    }

    // For demo mode, restore user from localStorage
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    // Demo login
    if (email === 'demo@example.com' && password === 'password') {
      const demoUser: User = {
        id: 1,
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('access_token', 'demo_token_' + Date.now());
      localStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
      setLoading(false);
      return;
    }

    // Try real API login
    try {
      const result = await authApi.login(email, password);
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  }, []);

  return { user, loading, error, login, logout, authenticated: !!user };
}
