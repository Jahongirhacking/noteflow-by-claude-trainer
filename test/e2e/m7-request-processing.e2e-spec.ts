import { ConsoleLogger, INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, buildUser, createUser, registerUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

const TIMING_HEADER = 'x-response-time';

describe('[M7] Middleware, Interceptor va xatolar formati', () => {
  let app: INestApplication;
  let ds: DataSource;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    // Test moduli logger'ni o'chirib qo'yadi — middleware logi ko'rinishi uchun qayta yoqamiz.
    app.useLogger(new ConsoleLogger({ logLevels: ['log', 'warn', 'error'] }));
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await cleanDatabase(ds);
  });
  afterAll(async () => {
    await app?.close();
  });

  describe('Timing interceptor ("X-Response-Time: 12ms" header)', () => {
    const TIMING = /^\d+(\.\d+)?ms$/;

    it('muvaffaqiyatli so`rovda (200) header bor', async () => {
      const user = await createUser(app);
      const res = await http().get('/notes').set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.headers[TIMING_HEADER]).toMatch(TIMING);
    });

    it('xato bilan tugagan so`rovda ham (404) header bor', async () => {
      const user = await createUser(app);
      const res = await http().get(`/notes/${randomUUID()}`).set(bearer(user.token));
      expect(res.status).toBe(404);
      expect(res.headers[TIMING_HEADER]).toMatch(TIMING);
    });

    it('validatsiya xatosida (400) ham header bor', async () => {
      const user = await createUser(app);
      const res = await http().post('/notes').set(bearer(user.token)).send({});
      expect(res.status).toBe(400);
      expect(res.headers[TIMING_HEADER]).toMatch(TIMING);
    });
  });

  describe('Request logging middleware', () => {
    /** So'rov davomida chiqqan barcha log matnini yig'adi. */
    async function captureLogs(run: () => Promise<unknown>): Promise<string> {
      const chunks: string[] = [];
      const push = (...args: unknown[]) => {
        chunks.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
        return true;
      };
      const spies = [
        jest.spyOn(process.stdout, 'write').mockImplementation(push as never),
        jest.spyOn(process.stderr, 'write').mockImplementation(push as never),
        jest.spyOn(console, 'log').mockImplementation(push as never),
        jest.spyOn(console, 'info').mockImplementation(push as never),
        jest.spyOn(console, 'warn').mockImplementation(push as never),
        jest.spyOn(console, 'error').mockImplementation(push as never),
      ];
      try {
        await run();
        await new Promise((r) => setTimeout(r, 150)); // 'finish' hodisasi uchun biroz kutamiz
      } finally {
        spies.forEach((s) => s.mockRestore());
      }
      return chunks.join('');
    }

    const linesWith = (output: string, needle: string) =>
      output.split('\n').filter((l) => l.includes(needle));

    it('method, URL va status kodini BIR QATORDA yozadi', async () => {
      const user = await createUser(app);
      const output = await captureLogs(async () => {
        await http().get('/auth/me').set(bearer(user.token));
        await http().post('/auth/login').send({ email: 'yoq@example.com', password: 'Passw0rd!123' });
      });

      const me = linesWith(output, '/auth/me');
      expect(me.length).toBeGreaterThan(0);
      expect(me.some((l) => l.includes('GET') && /\b200\b/.test(l))).toBe(true);

      const login = linesWith(output, '/auth/login');
      expect(login.length).toBeGreaterThan(0);
      expect(login.some((l) => l.includes('POST') && /\b401\b/.test(l))).toBe(true);
    });

    it('so`rov davomiyligini yozadi (masalan "12ms")', async () => {
      const user = await createUser(app);
      const output = await captureLogs(() => http().get('/auth/me').set(bearer(user.token)));
      expect(linesWith(output, '/auth/me').some((l) => /\d+(\.\d+)?\s?ms/.test(l))).toBe(true);
    });

    it('parolni, JWT tokenni va Authorization headerini HECH QACHON log ga yozmaydi', async () => {
      const secretPassword = 'SuperSecret#Pass99';
      const creds = buildUser({ password: secretPassword });
      let token = '';
      const output = await captureLogs(async () => {
        await registerUser(app, creds);
        const login = await http().post('/auth/login').send({ email: creds.email, password: secretPassword });
        token = login.body.accessToken;
        await http().get('/auth/me').set(bearer(token));
        await http().post('/auth/login').send({ email: creds.email, password: secretPassword + 'x' });
      });

      expect(token).not.toBe('');
      expect(output).not.toContain(secretPassword);
      expect(output).not.toContain(token);
      expect(output).not.toMatch(/Bearer\s+eyJ/);
      expect(output.toLowerCase()).not.toMatch(/authorization["']?\s*[:=]\s*["']?bearer/);
    });
  });

  describe('Xatolar formati', () => {
    async function errorCases() {
      const admin = await createUser(app);
      const dup = buildUser();
      await registerUser(app, dup);
      return [
        { status: 400, res: await http().post('/auth/register').send({}) },
        { status: 400, res: await http().get('/notes/not-a-uuid').set(bearer(admin.token)) },
        { status: 401, res: await http().get('/auth/me') },
        { status: 403, res: await http().get('/users').set(bearer(admin.token)) },
        { status: 404, res: await http().get(`/notes/${randomUUID()}`).set(bearer(admin.token)) },
        { status: 404, res: await http().get('/bunday-route-yoq') },
        { status: 409, res: await http().post('/auth/register').send(dup) },
      ];
    }

    it('har bir xato to`g`ri status kodi va `statusCode` + `message` maydonlari bilan JSON qaytaradi', async () => {
      for (const { status, res } of await errorCases()) {
        expect(res.status).toBe(status);
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body.statusCode).toBe(status);
        const msg = res.body.message;
        expect(typeof msg === 'string' || (Array.isArray(msg) && msg.length > 0)).toBe(true);
      }
    });

    it('xato javoblarida stack trace, fayl yo`llari va ichki ma`lumot yo`q', async () => {
      for (const { res } of await errorCases()) {
        const text = JSON.stringify(res.body);
        expect(res.body).not.toHaveProperty('stack');
        expect(text).not.toMatch(/node_modules|\.ts:\d+|\bat\s+\S+\s+\(/);
        expect(text.toLowerCase()).not.toMatch(/typeorm|querybuilder|select\s.+\sfrom|passwordhash/);
      }
    });

    it('validatsiya xabari tushunarli: qaysi maydon xato ekanini aytadi', async () => {
      const res = await http().post('/auth/register').send({ email: 'xato', password: '1' });
      expect(res.status).toBe(400);
      const text = JSON.stringify(res.body.message).toLowerCase();
      expect(text).toContain('email');
      expect(text).toContain('password');
    });
  });
});
