import { describe, it, expect, beforeEach } from 'vitest';
import { UberTokenProvider } from '@/infrastructure/uber-direct/uber-token-provider';

describe('UberTokenProvider (OAuth Cache)', () => {
  beforeEach(() => {
    UberTokenProvider.clearCache();
  });

  it('deve retornar token e reutilizar o cache em chamadas subsequentes', async () => {
    const t1 = await UberTokenProvider.getToken();
    const t2 = await UberTokenProvider.getToken();

    expect(t1).toBeDefined();
    expect(t1).toBe(t2); // Reutilizou o token de cache sem nova chamada OAuth
  });
});
