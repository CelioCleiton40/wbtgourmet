import { describe, it, expect, vi } from 'vitest';
import { Logger } from '@/shared/utils/logger';

describe('Logger Utility (LGPD & Security)', () => {
  it('deve mascarar números de telefone nos metadados para compliance LGPD', () => {
    const masked = Logger.maskPhone('5584988909408');
    expect(masked).toBe('5584******408');
  });

  it('deve omitir segredos, chaves e senhas dos logs', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    Logger.info('Teste de Segredo', {
      customerPhone: '5584988909408',
      secretKey: 'super-secret-key-123',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCallArg = consoleSpy.mock.calls[0][0];
    const logObj = JSON.parse(logCallArg);

    expect(logObj.secretKey).toBe('[REDACTED]');
    expect(logObj.customerPhone).toBe('5584******408');

    consoleSpy.mockRestore();
  });
});
