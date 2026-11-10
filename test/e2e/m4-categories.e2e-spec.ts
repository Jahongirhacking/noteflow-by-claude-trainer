import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, createUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { createCategory } from '../helpers/factories';

describe('[M4] Categories', () => {
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

  it.each([
    ['post', '/categories'],
    ['get', '/categories'],
    ['get', `/categories/${randomUUID()}`],
    ['patch', `/categories/${randomUUID()}`],
    ['delete', `/categories/${randomUUID()}`],
  ] as const)('%s %s JWT siz: 401', async (method, url) => {
    const res = await http()[method](url);
    expect(res.status).toBe(401);
  });

  describe('POST /categories', () => {
    it('yaratadi: 201 va to`liq obyekt', async () => {
      const user = await createUser(app);
      const res = await http()
        .post('/categories')
        .set(bearer(user.token))
        .send({ name: 'Ish', description: 'Ish bilan bog`liq' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Ish', description: 'Ish bilan bog`liq' });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toBeDefined();
    });

    it('description ixtiyoriy', async () => {
      const user = await createUser(app);
      const res = await http().post('/categories').set(bearer(user.token)).send({ name: 'Faqat nom' });
      expect(res.status).toBe(201);
    });

    it('category yaratgan userga tegishli bo`ladi (userId tokendan olinadi)', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      const rows = await ds.query('SELECT * FROM categories WHERE id = $1', [cat.id]);
      const userIdKey = Object.keys(rows[0]).find((k) => k.replace(/_/g, '').toLowerCase() === 'userid');
      expect(userIdKey).toBeDefined();
      expect(rows[0][userIdKey!]).toBe(user.id);
    });

    it.each([
      ['name yo`q', {}],
      ['name bo`sh', { name: '' }],
      ['name faqat bo`sh joy', { name: '   ' }],
      ['name son', { name: 123 }],
      ['name 101 belgi', { name: 'a'.repeat(101) }],
    ])('noto`g`ri DTO (%s): 400', async (_label, body) => {
      const user = await createUser(app);
      const res = await http().post('/categories').set(bearer(user.token)).send(body);
      expect(res.status).toBe(400);
    });

    it('ortiqcha maydon (userId) yuborilsa: 400', async () => {
      const user = await createUser(app);
      const other = await createUser(app);
      const res = await http()
        .post('/categories')
        .set(bearer(user.token))
        .send({ name: 'X', userId: other.id });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /categories', () => {
    it('faqat o`zining category larini qaytaradi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      await createCategory(app, a.token, { name: 'A1' });
      await createCategory(app, a.token, { name: 'A2' });
      await createCategory(app, b.token, { name: 'B1' });

      const resA = await http().get('/categories').set(bearer(a.token));
      expect(resA.status).toBe(200);
      expect(resA.body.map((c: { name: string }) => c.name).sort()).toEqual(['A1', 'A2']);

      const resB = await http().get('/categories').set(bearer(b.token));
      expect(resB.body.map((c: { name: string }) => c.name)).toEqual(['B1']);
    });

    it('category yo`q bo`lsa bo`sh massiv', async () => {
      const user = await createUser(app);
      const res = await http().get('/categories').set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /categories/:id', () => {
    it('o`zining category si: 200', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token, { name: 'Mening' });
      const res = await http().get(`/categories/${cat.id}`).set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: cat.id, name: 'Mening' });
    });

    it('boshqa userning category si: 404 (mavjudligi ham sezdirilmaydi)', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const cat = await createCategory(app, a.token);
      const res = await http().get(`/categories/${cat.id}`).set(bearer(b.token));
      expect(res.status).toBe(404);
    });

    it('mavjud bo`lmagan id: 404', async () => {
      const user = await createUser(app);
      const res = await http().get(`/categories/${randomUUID()}`).set(bearer(user.token));
      expect(res.status).toBe(404);
    });

    it('id UUID formatida bo`lmasa: 400', async () => {
      const user = await createUser(app);
      const res = await http().get('/categories/abc').set(bearer(user.token));
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('o`zining category sini yangilaydi: 200', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token, { name: 'Eski' });
      const res = await http()
        .patch(`/categories/${cat.id}`)
        .set(bearer(user.token))
        .send({ name: 'Yangi' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Yangi');
      const check = await http().get(`/categories/${cat.id}`).set(bearer(user.token));
      expect(check.body.name).toBe('Yangi');
    });

    it('boshqa userning category sini o`zgartira olmaydi: 404 va nom o`zgarmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const cat = await createCategory(app, a.token, { name: 'Asl' });
      const res = await http().patch(`/categories/${cat.id}`).set(bearer(b.token)).send({ name: 'Hack' });
      expect(res.status).toBe(404);
      const check = await http().get(`/categories/${cat.id}`).set(bearer(a.token));
      expect(check.body.name).toBe('Asl');
    });

    it('noto`g`ri DTO (bo`sh name): 400', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      const res = await http().patch(`/categories/${cat.id}`).set(bearer(user.token)).send({ name: '' });
      expect(res.status).toBe(400);
    });

    it('ortiqcha maydon (userId) yuborilsa: 400', async () => {
      const user = await createUser(app);
      const other = await createUser(app);
      const cat = await createCategory(app, user.token);
      const res = await http()
        .patch(`/categories/${cat.id}`)
        .set(bearer(user.token))
        .send({ userId: other.id });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('o`zining category sini o`chiradi: 204, keyin 404', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      const del = await http().delete(`/categories/${cat.id}`).set(bearer(user.token));
      expect(del.status).toBe(204);
      const get = await http().get(`/categories/${cat.id}`).set(bearer(user.token));
      expect(get.status).toBe(404);
    });

    it('boshqa userning category sini o`chira olmaydi: 404 va category saqlanib qoladi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const cat = await createCategory(app, a.token);
      const del = await http().delete(`/categories/${cat.id}`).set(bearer(b.token));
      expect(del.status).toBe(404);
      const get = await http().get(`/categories/${cat.id}`).set(bearer(a.token));
      expect(get.status).toBe(200);
    });

    it('mavjud bo`lmagan category: 404', async () => {
      const user = await createUser(app);
      const res = await http().delete(`/categories/${randomUUID()}`).set(bearer(user.token));
      expect(res.status).toBe(404);
    });
  });
});
