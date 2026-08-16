import { describe, expect, it } from 'vitest';
import { GET as handleCronGET, POST as handleCronPOST } from '@/../app/api/crons/process-outbox/route';

describe('Cron Outbox Worker API (/api/crons/process-outbox)', () => {
  it('deve retornar 401 Sem Autorização quando o token for inválido ou ausente', async () => {
    const request = new Request('http://localhost:3000/api/crons/process-outbox', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid_token',
      },
    });

    const response = await handleCronGET(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toBe('Não autorizado.');
  });

  it('deve executar com sucesso (200) e retornar processedCount quando token válido for fornecido', async () => {
    const validSecret = process.env.CRON_SECRET || 'wbt_gourmet_cron_secret_2026';

    const request = new Request('http://localhost:3000/api/crons/process-outbox', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validSecret}`,
      },
    });

    const response = await handleCronPOST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.processedCount).toBeDefined();
  });
});
