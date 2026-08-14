export class Logger {
  public static info(event: string, meta: Record<string, unknown> = {}): void {
    this.log('INFO', event, meta);
  }

  public static warn(event: string, meta: Record<string, unknown> = {}): void {
    this.log('WARN', event, meta);
  }

  public static error(event: string, error: unknown, meta: Record<string, unknown> = {}): void {
    const errorMeta = {
      ...meta,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'UnknownError',
    };
    this.log('ERROR', event, errorMeta);
  }

  private static log(level: 'INFO' | 'WARN' | 'ERROR', event: string, meta: Record<string, unknown>): void {
    const sanitizedMeta = this.sanitizeMeta(meta);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...sanitizedMeta,
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  private static sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(meta)) {
      if (/secret|token|password|auth|key/i.test(key)) {
        clean[key] = '[REDACTED]';
        continue;
      }

      if (key.toLowerCase().includes('phone') && typeof value === 'string') {
        clean[key] = this.maskPhone(value);
        continue;
      }

      clean[key] = value;
    }

    return clean;
  }

  public static maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return '***';
    const prefix = digits.substring(0, 4);
    const suffix = digits.substring(digits.length - 3);
    return `${prefix}******${suffix}`;
  }
}
