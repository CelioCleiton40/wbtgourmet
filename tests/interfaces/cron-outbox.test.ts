import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { GET as handleCronGET, POST as handleCronPOST } from '@/../app/api/crons/process-outbox/route';

describe('Cron Outbox Worker API (/api/crons/process-outbox)', () => {
  const TEST_SECRET = 'wbt_gourmet_cron_secret_test_2026';
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it('deve retornar 500 Erro de Configuração quando CRON_SECRET não estiver definido no ambiente', async () => {
    delete process.env.CRON_SECRET;

    const request = new Request('http://localhost:3000/api/crons/process-outbox', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    const response = await handleCronGET(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('Serviço de agendamento não configurado adequadamente.');
  });

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
    const request = new Request('http://localhost:3000/api/crons/process-outbox', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_SECRET}`,
      },
    });

    const response = await handleCronPOST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.processedCount).toBeDefined();
  });
});
