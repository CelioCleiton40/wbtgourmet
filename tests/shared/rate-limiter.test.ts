import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/shared/rate-limit/rate-limiter';
import { RateLimitError } from '@/shared/errors/domain-errors';

describe('RateLimiter Utility', () => {
  beforeEach(() => {
    RateLimiter.reset();
  });

  it('deve permitir requisições até o limite máximo configurado', () => {
    const limiter = new RateLimiter(5, 60); // limite de 5 requisições

    for (let i = 0; i < 5; i++) {
      expect(() => limiter.check('client-ip-1')).not.toThrow();
    }
  });

  it('deve lançar RateLimitError ao ultrapassar o limite de requisições (6ª chamada)', () => {
    const limiter = new RateLimiter(5, 60);

    for (let i = 0; i < 5; i++) {
      limiter.check('client-ip-2');
    }

    expect(() => limiter.check('client-ip-2')).toThrow(RateLimitError);
  });

  it('deve isolar contadores por chaves/IPs diferentes', () => {
    const limiter = new RateLimiter(2, 60);

    limiter.check('ip-a');
    limiter.check('ip-a');

    expect(() => limiter.check('ip-a')).toThrow(RateLimitError);
    // IP B deve ser permitido pois possui sua própria quota
    expect(() => limiter.check('ip-b')).not.toThrow();
  });
});
