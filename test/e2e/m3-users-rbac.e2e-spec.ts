import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, createAdmin, createUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';

describe('[M3] Users va RBAC', () => {
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

  describe('GET /users (faqat ADMIN)', () => {
    it('JWT siz: 401', async () => {
      expect((await http().get('/users')).status).toBe(401);
    });

    it('oddiy USER: 403', async () => {
      const user = await createUser(app);
      const res = await http().get('/users').set(bearer(user.token));
      expect(res.status).toBe(403);
    });

    it('ADMIN: 200 va barcha userlar ro`yxati, hash siz', async () => {
      const admin = await createAdmin(app);
      await createUser(app);
      await createUser(app);
      const res = await http().get('/users').set(bearer(admin.token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
      for (const u of res.body) {
        expect(u).not.toHaveProperty('passwordHash');
        expect(u).not.toHaveProperty('password');
      }
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    });
  });

  describe('GET /users/:id', () => {
    it('JWT siz: 401', async () => {
      expect((await http().get(`/users/${randomUUID()}`)).status).toBe(401);
    });

    it('USER o`z profilini ko`ra oladi', async () => {
      const user = await createUser(app);
      const res = await http().get(`/users/${user.id}`).set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: user.id, email: user.email });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('USER boshqa userning profilini ko`ra olmaydi: 403', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const res = await http().get(`/users/${b.id}`).set(bearer(a.token));
      expect(res.status).toBe(403);
    });

    it('ADMIN istalgan userni ko`ra oladi', async () => {
      const admin = await createAdmin(app);
      const user = await createUser(app);
      const res = await http().get(`/users/${user.id}`).set(bearer(admin.token));
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.id);
    });

    it('ADMIN mavjud bo`lmagan user so`rasa: 404', async () => {
      const admin = await createAdmin(app);
      const res = await http().get(`/users/${randomUUID()}`).set(bearer(admin.token));
      expect(res.status).toBe(404);
    });

    it('id UUID formatida bo`lmasa: 400', async () => {
      const user = await createUser(app);
      const res = await http().get('/users/123').set(bearer(user.token));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('USER o`z fullName ini yangilaydi (200) va o`zgarish saqlanadi', async () => {
      const user = await createUser(app);
      const res = await http()
        .patch(`/users/${user.id}`)
        .set(bearer(user.token))
        .send({ fullName: 'Yangi Ism' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Yangi Ism');
      expect(res.body).not.toHaveProperty('passwordHash');

      const me = await http().get('/auth/me').set(bearer(user.token));
      expect(me.body.fullName).toBe('Yangi Ism');
    });

    it('USER boshqa userni o`zgartira olmaydi: 403 va ma`lumot o`zgarmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const res = await http().patch(`/users/${b.id}`).set(bearer(a.token)).send({ fullName: 'Hack' });
      expect(res.status).toBe(403);
      const rows = await ds.query('SELECT * FROM users WHERE id = $1', [b.id]);
      expect(JSON.stringify(rows[0])).not.toContain('Hack');
    });

    it('USER o`z role ini o`zgartira olmaydi: 400 (role — ruxsat etilmagan maydon) va role o`zgarmaydi', async () => {
      const user = await createUser(app);
      const res = await http().patch(`/users/${user.id}`).set(bearer(user.token)).send({ role: 'ADMIN' });
      expect(res.status).toBe(400);
      const rows = await ds.query('SELECT role FROM users WHERE id = $1', [user.id]);
      expect(rows[0].role).toBe('USER');
    });

    it('email, passwordHash kabi maydonlar ham ruxsat etilmagan: 400', async () => {
      const user = await createUser(app);
      for (const body of [{ email: 'x@y.com' }, { passwordHash: 'abc' }, { id: randomUUID() }]) {
        const res = await http().patch(`/users/${user.id}`).set(bearer(user.token)).send(body);
        expect(res.status).toBe(400);
      }
    });

    it('bo`sh fullName: 400', async () => {
      const user = await createUser(app);
      const res = await http().patch(`/users/${user.id}`).set(bearer(user.token)).send({ fullName: '' });
      expect(res.status).toBe(400);
    });

    it('ADMIN boshqa userning fullName ini o`zgartira oladi, lekin role ni emas', async () => {
      const admin = await createAdmin(app);
      const user = await createUser(app);
      const ok = await http()
        .patch(`/users/${user.id}`)
        .set(bearer(admin.token))
        .send({ fullName: 'Admin O`zgartirdi' });
      expect(ok.status).toBe(200);
      const bad = await http().patch(`/users/${user.id}`).set(bearer(admin.token)).send({ role: 'ADMIN' });
      expect(bad.status).toBe(400);
    });

    it('JWT siz: 401', async () => {
      const res = await http().patch(`/users/${randomUUID()}`).send({ fullName: 'X' });
      expect(res.status).toBe(401);
    });
  });
});
