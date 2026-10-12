import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';

describe('API simulada: health', () => {
  it('GET /health responde ok', async () => {
    const { data } = await api.GET('/health');

    expect(data?.status).toBe('ok');
  });
});
