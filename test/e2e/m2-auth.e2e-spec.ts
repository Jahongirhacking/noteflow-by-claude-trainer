import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, buildUser, createUser, loginUser, registerUser, VALID_PASSWORD } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

describe('[M2] Ro`yxatdan o`tish va autentifikatsiya', () => {
  let app: INestApplication;
  let ds: DataSource;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await cleanDatabase(ds);
  });
  afterAll(async () => {
    await app?.close();
  });

  describe('POST /auth/register', () => {
    it('muvaffaqiyatli: 201, user qaytaradi, parol/hash qaytarmaydi', async () => {
      const { res, creds } = await registerUser(app);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: creds.email, fullName: creds.fullName, role: 'USER' });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toBeDefined();
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain(creds.password);
    });

    it('parol database da bcrypt hash sifatida saqlanadi (ochiq matn emas)', async () => {
      const { creds } = await registerUser(app);
      const rows = await ds.query('SELECT * FROM users WHERE email = $1', [creds.email]);
      expect(rows).toHaveLength(1);
      const hashKey = Object.keys(rows[0]).find((k) => k.replace(/_/g, '').toLowerCase() === 'passwordhash');
      expect(hashKey).toBeDefined();
      expect(rows[0][hashKey!]).not.toBe(creds.password);
      expect(rows[0][hashKey!]).toMatch(/^\$2[aby]\$/);
    });

    it('bir xil email bilan ikkinchi marta: 409 Conflict', async () => {
      const { creds } = await registerUser(app);
      const res = await http().post('/auth/register').send({ ...buildUser(), email: creds.email });
      expect(res.status).toBe(409);
    });

    it('noto`g`ri email: 400', async () => {
      const res = await http().post('/auth/register').send(buildUser({ email: 'bu-email-emas' }));
      expect(res.status).toBe(400);
    });

    it.each(['short1', '12345678', 'abcdefgh', ''])(
      'zaif parol "%s": 400 (kamida 8 belgi, harf va raqam bo`lishi shart)',
      async (password) => {
        const res = await http().post('/auth/register').send(buildUser({ password }));
        expect(res.status).toBe(400);
      },
    );

    it('fullName yo`q: 400', async () => {
      const { fullName, ...rest } = buildUser();
      void fullName;
      const res = await http().post('/auth/register').send(rest);
      expect(res.status).toBe(400);
    });

    it('ortiqcha maydon (role: ADMIN) yuborilsa: 400 — o`zini admin qilib bo`lmaydi', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ ...buildUser(), role: 'ADMIN' });
      expect(res.status).toBe(400);
      const rows = await ds.query('SELECT COUNT(*)::int AS c FROM users');
      expect(rows[0].c).toBe(0);
    });
  });

  describe('POST /auth/login', () => {
    it('muvaffaqiyatli: 200 va accessToken', async () => {
      const { creds } = await registerUser(app);
      const res = await loginUser(app, creds.email, creds.password);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.accessToken.split('.')).toHaveLength(3); // JWT: header.payload.signature
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('noto`g`ri parol: 401', async () => {
      const { creds } = await registerUser(app);
      const res = await loginUser(app, creds.email, 'BoshqaParol123');
      expect(res.status).toBe(401);
    });

    it('mavjud bo`lmagan email: 401 va xabar noto`g`ri parol bilan bir xil (email mavjudligi sezdirilmaydi)', async () => {
      const { creds } = await registerUser(app);
      const wrongPass = await loginUser(app, creds.email, 'BoshqaParol123');
      const wrongEmail = await loginUser(app, 'yoq@example.com', VALID_PASSWORD);
      expect(wrongEmail.status).toBe(401);
      expect(wrongEmail.body.message).toEqual(wrongPass.body.message);
    });

    it('body to`liq emas (parolsiz): 400', async () => {
      const res = await http().post('/auth/login').send({ email: 'a@b.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('JWT siz: 401', async () => {
      expect((await http().get('/auth/me')).status).toBe(401);
    });

    it('noto`g`ri JWT: 401', async () => {
      const res = await http().get('/auth/me').set(bearer('bu.haqiqiy.token-emas'));
      expect(res.status).toBe(401);
    });

    it('imzosi buzilgan (o`zgartirilgan) JWT: 401', async () => {
      const user = await createUser(app);
      const [h, p, s] = user.token.split('.');
      const tampered = `${h}.${p}.${s.slice(0, -2)}${s.endsWith('aa') ? 'bb' : 'aa'}`;
      const res = await http().get('/auth/me').set(bearer(tampered));
      expect(res.status).toBe(401);
    });

    it('"Bearer" siz yuborilgan header: 401', async () => {
      const user = await createUser(app);
      const res = await http().get('/auth/me').set('Authorization', user.token);
      expect(res.status).toBe(401);
    });

    it('to`g`ri JWT: 200 va joriy user (parol/hash siz)', async () => {
      const user = await createUser(app);
      const res = await http().get('/auth/me').set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, email: user.email, role: 'USER' });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
    });

    it('har bir user faqat o`zining ma`lumotini oladi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const resA = await http().get('/auth/me').set(bearer(a.token));
      const resB = await http().get('/auth/me').set(bearer(b.token));
      expect(resA.body.id).toBe(a.id);
      expect(resB.body.id).toBe(b.id);
    });
  });
});
