import { RateLimitError } from '@/shared/errors/domain-errors';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private static store = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  public check(key: string): void {
    const now = Date.now();
    const record = RateLimiter.store.get(key);

    if (!record || now > record.resetAt) {
      RateLimiter.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      throw new RateLimitError(
        'Muitas requisições enviadas em curto período. Por favor, aguarde antes de tentar novamente.'
      );
    }

    record.count += 1;
  }

  public static reset(): void {
    RateLimiter.store.clear();
  }
}
