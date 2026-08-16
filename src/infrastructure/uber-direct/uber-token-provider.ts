import { Logger } from '@/shared/utils/logger';

export class UberTokenProvider {
  private static cachedToken: string | null = null;
  private static expiresAt: number | null = null;

  public static async getToken(): Promise<string> {
    const now = Date.now();

    // Reutilizar token de cache se ainda estiver válido (com margem de segurança de 5 min)
    if (this.cachedToken && this.expiresAt && now < this.expiresAt - 5 * 60 * 1000) {
      return this.cachedToken;
    }

    const clientId = process.env.UBER_DIRECT_CLIENT_ID;
    const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      Logger.warn('UBER_DIRECT_CLIENT_ID ou UBER_DIRECT_CLIENT_SECRET ausente. Utilizando token mock de fallback.');
      return 'mock_uber_oauth_token';
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries',
      });

      const response = await fetch('https://auth.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        Logger.error(`Falha na autenticação OAuth2 da Uber Direct (HTTP ${response.status})`, new Error(errText));
        return 'mock_uber_oauth_token';
      }

      const data = await response.json();
      this.cachedToken = data.access_token;
      // expires_in em segundos -> converter para timestamp em ms
      const expiresInMs = (data.expires_in || 2592000) * 1000;
      this.expiresAt = now + expiresInMs;

      return this.cachedToken!;
    } catch (err) {
      Logger.error('Exceção ao obter token OAuth2 da Uber Direct. Utilizando mock fallback.', err);
      return 'mock_uber_oauth_token';
    }
  }

  public static clearCache(): void {
    this.cachedToken = null;
    this.expiresAt = null;
  }
}
