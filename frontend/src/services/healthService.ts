import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SystemHealthStatus, ApiResponseEnvelope } from '../types';

export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
  version: () => [...healthKeys.all, 'version'] as const,
  checks: () => [...healthKeys.all, 'checks'] as const,
};

export function useGetHealth() {
  return useQuery<ApiResponseEnvelope<SystemHealthStatus>, Error>({
    queryKey: healthKeys.checks(),
    queryFn: async () => {
      const response = await apiClient.get<any, ApiResponseEnvelope<SystemHealthStatus>>('/health');
      return response;
    },
    refetchInterval: 30000, // Check system health every 30 seconds
    retry: 2,
  });
}

export function useGetVersion() {
  return useQuery<ApiResponseEnvelope<{ name: string; version: string; api_version: string }>, Error>({
    queryKey: healthKeys.version(),
    queryFn: async () => {
      return await apiClient.get<any, ApiResponseEnvelope<{ name: string; version: string; api_version: string }>>('/version');
    },
    staleTime: Infinity, // Version info doesn't change during session runtime
  });
}

export function useGetStatus() {
  return useQuery<ApiResponseEnvelope<any>, Error>({
    queryKey: healthKeys.status(),
    queryFn: async () => {
      return await apiClient.get<any, ApiResponseEnvelope<any>>('/status');
    },
    refetchInterval: 60000, // Uptime refresh check
  });
}
