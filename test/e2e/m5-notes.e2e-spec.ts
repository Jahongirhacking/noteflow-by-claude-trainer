import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, createUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { createCategory, createNote } from '../helpers/factories';

describe('[M5] Notes', () => {
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
    ['post', '/notes'],
    ['get', '/notes'],
    ['get', `/notes/${randomUUID()}`],
    ['patch', `/notes/${randomUUID()}`],
    ['delete', `/notes/${randomUUID()}`],
    ['patch', `/notes/${randomUUID()}/archive`],
  ] as const)('%s %s JWT siz: 401', async (method, url) => {
    const res = await http()[method](url);
    expect(res.status).toBe(401);
  });

  describe('POST /notes', () => {
    it('category siz note yaratadi: 201, isArchived=false, categoryId=null', async () => {
      const user = await createUser(app);
      const res = await http()
        .post('/notes')
        .set(bearer(user.token))
        .send({ title: 'Birinchi', content: 'Matn' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: 'Birinchi',
        content: 'Matn',
        isArchived: false,
        categoryId: null,
        userId: user.id,
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toBeDefined();
    });

    it('content berilmasa — bo`sh satr ("") bo`ladi', async () => {
      const user = await createUser(app);
      const res = await http().post('/notes').set(bearer(user.token)).send({ title: 'Faqat sarlavha' });
      expect(res.status).toBe(201);
      expect(res.body.content).toBe('');
    });

    it('o`zining category si bilan yaratadi', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      const res = await http()
        .post('/notes')
        .set(bearer(user.token))
        .send({ title: 'Kategoriyali', categoryId: cat.id });
      expect(res.status).toBe(201);
      expect(res.body.categoryId).toBe(cat.id);
    });

    it('BOSHQA userning category sini biriktirib bo`lmaydi: 404 va note yaratilmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const catOfB = await createCategory(app, b.token);
      const res = await http()
        .post('/notes')
        .set(bearer(a.token))
        .send({ title: 'Hack', categoryId: catOfB.id });
      expect(res.status).toBe(404);
      const rows = await ds.query('SELECT COUNT(*)::int AS c FROM notes');
      expect(rows[0].c).toBe(0);
    });

    it('mavjud bo`lmagan categoryId: 404', async () => {
      const user = await createUser(app);
      const res = await http()
        .post('/notes')
        .set(bearer(user.token))
        .send({ title: 'X', categoryId: randomUUID() });
      expect(res.status).toBe(404);
    });

    it.each([
      ['title yo`q', { content: 'x' }],
      ['title bo`sh', { title: '' }],
      ['title 201 belgi', { title: 'a'.repeat(201) }],
      ['title son', { title: 5 }],
      ['content matn emas', { title: 'X', content: 123 }],
      ['categoryId UUID emas', { title: 'X', categoryId: 'abc' }],
    ])('noto`g`ri DTO (%s): 400', async (_label, body) => {
      const user = await createUser(app);
      const res = await http().post('/notes').set(bearer(user.token)).send(body);
      expect(res.status).toBe(400);
    });

    it.each([
      ['userId', () => ({ userId: randomUUID() })],
      ['isArchived', () => ({ isArchived: true })],
      ['id', () => ({ id: randomUUID() })],
      ['noma`lum maydon', () => ({ hello: 'world' })],
    ])('ortiqcha maydon (%s) yuborilsa: 400', async (_label, extra) => {
      const user = await createUser(app);
      const res = await http()
        .post('/notes')
        .set(bearer(user.token))
        .send({ title: 'X', ...extra() });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /notes/:id', () => {
    it('o`zining note i: 200', async () => {
      const user = await createUser(app);
      const note = await createNote(app, user.token, { title: 'Mening' });
      const res = await http().get(`/notes/${note.id}`).set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: note.id, title: 'Mening' });
    });

    it('boshqa userning note i: 404', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const note = await createNote(app, a.token);
      const res = await http().get(`/notes/${note.id}`).set(bearer(b.token));
      expect(res.status).toBe(404);
    });

    it('mavjud bo`lmagan id: 404; UUID emas: 400', async () => {
      const user = await createUser(app);
      expect((await http().get(`/notes/${randomUUID()}`).set(bearer(user.token))).status).toBe(404);
      expect((await http().get('/notes/abc').set(bearer(user.token))).status).toBe(400);
    });
  });

  describe('PATCH /notes/:id', () => {
    it('title va content ni yangilaydi: 200', async () => {
      const user = await createUser(app);
      const note = await createNote(app, user.token);
      const res = await http()
        .patch(`/notes/${note.id}`)
        .set(bearer(user.token))
        .send({ title: 'Yangi', content: 'Yangi matn' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ title: 'Yangi', content: 'Yangi matn' });
      const check = await http().get(`/notes/${note.id}`).set(bearer(user.token));
      expect(check.body.title).toBe('Yangi');
    });

    it('note ni o`zining boshqa category siga ko`chiradi', async () => {
      const user = await createUser(app);
      const c1 = await createCategory(app, user.token);
      const c2 = await createCategory(app, user.token);
      const note = await createNote(app, user.token, { categoryId: c1.id });
      const res = await http()
        .patch(`/notes/${note.id}`)
        .set(bearer(user.token))
        .send({ categoryId: c2.id });
      expect(res.status).toBe(200);
      expect(res.body.categoryId).toBe(c2.id);
    });

    it('BOSHQA userning category siga ko`chirib bo`lmaydi: 404 va categoryId o`zgarmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const catOfB = await createCategory(app, b.token);
      const note = await createNote(app, a.token);
      const res = await http()
        .patch(`/notes/${note.id}`)
        .set(bearer(a.token))
        .send({ categoryId: catOfB.id });
      expect(res.status).toBe(404);
      const check = await http().get(`/notes/${note.id}`).set(bearer(a.token));
      expect(check.body.categoryId).toBeNull();
    });

    it('boshqa userning note ini o`zgartira olmaydi: 404 va ma`lumot o`zgarmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const note = await createNote(app, a.token, { title: 'Asl' });
      const res = await http().patch(`/notes/${note.id}`).set(bearer(b.token)).send({ title: 'Hack' });
      expect(res.status).toBe(404);
      const check = await http().get(`/notes/${note.id}`).set(bearer(a.token));
      expect(check.body.title).toBe('Asl');
    });

    it.each([
      ['bo`sh title', { title: '' }],
      ['userId', { userId: randomUUID() }],
      ['isArchived (buning uchun /archive endpoint bor)', { isArchived: true }],
    ])('noto`g`ri DTO / ortiqcha maydon (%s): 400', async (_label, body) => {
      const user = await createUser(app);
      const note = await createNote(app, user.token);
      const res = await http().patch(`/notes/${note.id}`).set(bearer(user.token)).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /notes/:id', () => {
    it('o`zining note ini o`chiradi: 204, keyin 404', async () => {
      const user = await createUser(app);
      const note = await createNote(app, user.token);
      expect((await http().delete(`/notes/${note.id}`).set(bearer(user.token))).status).toBe(204);
      expect((await http().get(`/notes/${note.id}`).set(bearer(user.token))).status).toBe(404);
    });

    it('boshqa userning note ini o`chira olmaydi: 404 va note saqlanadi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const note = await createNote(app, a.token);
      expect((await http().delete(`/notes/${note.id}`).set(bearer(b.token))).status).toBe(404);
      expect((await http().get(`/notes/${note.id}`).set(bearer(a.token))).status).toBe(200);
    });

    it('mavjud bo`lmagan note: 404', async () => {
      const user = await createUser(app);
      const res = await http().delete(`/notes/${randomUUID()}`).set(bearer(user.token));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /notes/:id/archive', () => {
    it('arxivlaydi, qayta chaqirilsa tiklaydi (toggle)', async () => {
      const user = await createUser(app);
      const note = await createNote(app, user.token);

      const first = await http().patch(`/notes/${note.id}/archive`).set(bearer(user.token));
      expect(first.status).toBe(200);
      expect(first.body.isArchived).toBe(true);

      const second = await http().patch(`/notes/${note.id}/archive`).set(bearer(user.token));
      expect(second.status).toBe(200);
      expect(second.body.isArchived).toBe(false);

      const check = await http().get(`/notes/${note.id}`).set(bearer(user.token));
      expect(check.body.isArchived).toBe(false);
    });

    it('arxivlangan holat saqlanadi', async () => {
      const user = await createUser(app);
      const note = await createNote(app, user.token);
      await http().patch(`/notes/${note.id}/archive`).set(bearer(user.token));
      const check = await http().get(`/notes/${note.id}`).set(bearer(user.token));
      expect(check.body.isArchived).toBe(true);
    });

    it('boshqa userning note ini arxivlay olmaydi: 404 va holat o`zgarmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const note = await createNote(app, a.token);
      const res = await http().patch(`/notes/${note.id}/archive`).set(bearer(b.token));
      expect(res.status).toBe(404);
      const check = await http().get(`/notes/${note.id}`).set(bearer(a.token));
      expect(check.body.isArchived).toBe(false);
    });

    it('mavjud bo`lmagan note: 404', async () => {
      const user = await createUser(app);
      const res = await http().patch(`/notes/${randomUUID()}/archive`).set(bearer(user.token));
      expect(res.status).toBe(404);
    });
  });

  describe('Category o`chirilganda note lar (siyosat: note lar SAQLANADI, categoryId = null bo`ladi)', () => {
    it('category o`chiriladi, note esa qoladi va categoryId null bo`ladi', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      const note = await createNote(app, user.token, { categoryId: cat.id });

      const del = await http().delete(`/categories/${cat.id}`).set(bearer(user.token));
      expect(del.status).toBe(204);

      const res = await http().get(`/notes/${note.id}`).set(bearer(user.token));
      expect(res.status).toBe(200);
      expect(res.body.categoryId).toBeNull();
    });
  });
});
