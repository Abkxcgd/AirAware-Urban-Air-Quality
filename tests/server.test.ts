// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../server';

describe('Express API Server', () => {
  let server: Server;
  let baseUrl: string;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    const app = await createApp({ enableVite: false });
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('returns health status and baseline security headers', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('x-powered-by')).toBeNull();
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('accurately reports whether GEMINI_API_KEY is configured', async () => {
    delete process.env.GEMINI_API_KEY;
    const unconfigured = await fetch(`${baseUrl}/api/assistant/status`);
    expect(await unconfigured.json()).toEqual({ aiConfigured: false, provider: 'rule-based' });

    process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
    const placeholder = await fetch(`${baseUrl}/api/assistant/status`);
    expect(await placeholder.json()).toEqual({ aiConfigured: false, provider: 'rule-based' });

    process.env.GEMINI_API_KEY = 'test-configured-key-value';
    const configured = await fetch(`${baseUrl}/api/assistant/status`);
    expect(await configured.json()).toEqual({ aiConfigured: true, provider: 'gemini' });
  });

  it('validates assistant inputs and rejects empty or oversized messages', async () => {
    const emptyRes = await fetch(`${baseUrl}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });
    expect(emptyRes.status).toBe(400);

    const longRes = await fetch(`${baseUrl}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'x'.repeat(1200) }),
    });
    expect(longRes.status).toBe(400);
  });

  it('returns 503 when POST /api/assistant is called without a configured API key', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await fetch(`${baseUrl}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Is it safe to run today?' }),
    });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { configured: boolean; error: string };
    expect(body.configured).toBe(false);
    expect(body.error).toContain('No server-side AI API key');
  });
});
