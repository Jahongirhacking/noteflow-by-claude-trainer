import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, createUser, TestUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { createCategory, createNote } from '../helpers/factories';

type NoteBody = { id: string; title: string; categoryId: string | null; isArchived: boolean; createdAt: string };

describe('[M6] Notes: pagination, filtrlash va qidiruv', () => {
  let app: INestApplication;
  let ds: DataSource;
  const http = () => request(app.getHttpServer());
  const list = (token: string, query = '') => http().get(`/notes${query}`).set(bearer(token));

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

  async function seed25(user: TestUser) {
    const ids: string[] = [];
    for (let i = 1; i <= 25; i++) {
      const note = await createNote(app, user.token, { title: `Note ${String(i).padStart(2, '0')}` });
      ids.push(note.id);
    }
    return ids;
  }

  describe('Pagination', () => {
    it('standart: page=1, limit=10 va meta qaytaradi', async () => {
      const user = await createUser(app);
      await seed25(user);
      const res = await list(user.token);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.meta).toEqual({ total: 25, page: 1, limit: 10, totalPages: 3 });
    });

    it('oxirgi sahifada qolgan yozuvlar qaytadi', async () => {
      const user = await createUser(app);
      await seed25(user);
      const res = await list(user.token, '?page=3&limit=10');
      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 });
    });

    it('mavjud bo`lmagan sahifa: bo`sh data, lekin to`g`ri meta', async () => {
      const user = await createUser(app);
      await seed25(user);
      const res = await list(user.token, '?page=99&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(25);
    });

    it('sahifalar kesishmaydi va birgalikda hamma yozuvni qamrab oladi', async () => {
      const user = await createUser(app);
      const ids = await seed25(user);
      const seen: string[] = [];
      for (const page of [1, 2, 3, 4, 5]) {
        const res = await list(user.token, `?page=${page}&limit=5`);
        seen.push(...res.body.data.map((n: NoteBody) => n.id));
      }
      expect(new Set(seen).size).toBe(25);
      expect([...seen].sort()).toEqual([...ids].sort());
    });

    it('tartib: eng yangi note birinchi (createdAt kamayish tartibida)', async () => {
      const user = await createUser(app);
      await seed25(user);
      const res = await list(user.token, '?limit=25');
      const times = res.body.data.map((n: NoteBody) => new Date(n.createdAt).getTime());
      for (let i = 1; i < times.length; i++) expect(times[i]).toBeLessThanOrEqual(times[i - 1]);
      expect(res.body.data[0].title).toBe('Note 25');
    });

    it.each(['page=0', 'page=-1', 'page=abc', 'page=1.5', 'limit=0', 'limit=-5', 'limit=51', 'limit=1000', 'limit=abc'])(
      'noto`g`ri query (%s): 400',
      async (q) => {
        const user = await createUser(app);
        const res = await list(user.token, `?${q}`);
        expect(res.status).toBe(400);
      },
    );

    it('noma`lum query parametr: 400', async () => {
      const user = await createUser(app);
      const res = await list(user.token, '?foo=bar');
      expect(res.status).toBe(400);
    });

    it('note lari yo`q user uchun: bo`sh ro`yxat va total=0', async () => {
      const user = await createUser(app);
      const res = await list(user.token);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({ total: 0, page: 1, limit: 10, totalPages: 0 });
    });
  });

  describe('Izolyatsiya', () => {
    it('ro`yxat va total faqat o`z note laringni hisoblaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      await createNote(app, a.token, { title: 'A note' });
      await createNote(app, b.token, { title: 'B note 1' });
      await createNote(app, b.token, { title: 'B note 2' });

      const resA = await list(a.token);
      expect(resA.body.meta.total).toBe(1);
      expect(resA.body.data.map((n: NoteBody) => n.title)).toEqual(['A note']);
      const resB = await list(b.token);
      expect(resB.body.meta.total).toBe(2);
    });
  });

  describe('Filtrlash', () => {
    it('categoryId bo`yicha filtrlaydi', async () => {
      const user = await createUser(app);
      const work = await createCategory(app, user.token, { name: 'Work' });
      const home = await createCategory(app, user.token, { name: 'Home' });
      await createNote(app, user.token, { title: 'W1', categoryId: work.id });
      await createNote(app, user.token, { title: 'W2', categoryId: work.id });
      await createNote(app, user.token, { title: 'H1', categoryId: home.id });
      await createNote(app, user.token, { title: 'No category' });

      const res = await list(user.token, `?categoryId=${work.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.map((n: NoteBody) => n.title).sort()).toEqual(['W1', 'W2']);
      expect(res.body.meta.total).toBe(2);
    });

    it('boshqa userning categoryId si bilan filtrlansa natija bo`sh (ma`lumot sizmaydi)', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      const catOfB = await createCategory(app, b.token);
      await createNote(app, b.token, { categoryId: catOfB.id });
      await createNote(app, a.token);

      const res = await list(a.token, `?categoryId=${catOfB.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('categoryId UUID emas: 400', async () => {
      const user = await createUser(app);
      expect((await list(user.token, '?categoryId=abc')).status).toBe(400);
    });

    it('isArchived=true faqat arxivlanganlarni, isArchived=false faqat faollarni qaytaradi', async () => {
      const user = await createUser(app);
      const n1 = await createNote(app, user.token, { title: 'Active 1' });
      await createNote(app, user.token, { title: 'Active 2' });
      const n3 = await createNote(app, user.token, { title: 'Archived 1' });
      await http().patch(`/notes/${n3.id}/archive`).set(bearer(user.token));
      void n1;

      const archived = await list(user.token, '?isArchived=true');
      expect(archived.body.data.map((n: NoteBody) => n.title)).toEqual(['Archived 1']);
      expect(archived.body.meta.total).toBe(1);

      const active = await list(user.token, '?isArchived=false');
      expect(active.body.data.map((n: NoteBody) => n.title).sort()).toEqual(['Active 1', 'Active 2']);
      expect(active.body.meta.total).toBe(2);
    });

    it('isArchived berilmasa — arxivlangan va faol note lar birga qaytadi', async () => {
      const user = await createUser(app);
      await createNote(app, user.token);
      const n2 = await createNote(app, user.token);
      await http().patch(`/notes/${n2.id}/archive`).set(bearer(user.token));
      const res = await list(user.token);
      expect(res.body.meta.total).toBe(2);
    });

    it('isArchived=maybe: 400', async () => {
      const user = await createUser(app);
      expect((await list(user.token, '?isArchived=maybe')).status).toBe(400);
    });
  });

  describe('Qidiruv (search — title bo`yicha)', () => {
    async function seedSearch(user: TestUser) {
      await createNote(app, user.token, { title: 'Weekly Meeting notes' });
      await createNote(app, user.token, { title: 'meeting with client' });
      await createNote(app, user.token, { title: 'Shopping list' });
      await createNote(app, user.token, { title: '100% done' });
    }

    it('qisman moslik, katta-kichik harfga e`tiborsiz', async () => {
      const user = await createUser(app);
      await seedSearch(user);
      for (const q of ['meeting', 'MEETING', 'Meet']) {
        const res = await list(user.token, `?search=${q}`);
        expect(res.status).toBe(200);
        expect(res.body.data.map((n: NoteBody) => n.title).sort()).toEqual([
          'Weekly Meeting notes',
          'meeting with client',
        ]);
        expect(res.body.meta.total).toBe(2);
      }
    });

    it('hech narsa topilmasa: bo`sh ro`yxat', async () => {
      const user = await createUser(app);
      await seedSearch(user);
      const res = await list(user.token, '?search=zzzz');
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('"%" belgisi oddiy belgi sifatida qidiriladi (hamma narsaga mos kelmaydi)', async () => {
      const user = await createUser(app);
      await seedSearch(user);
      const res = await list(user.token, `?search=${encodeURIComponent('%')}`);
      expect(res.body.data.map((n: NoteBody) => n.title)).toEqual(['100% done']);
    });

    it('boshqa userning note lari qidiruvda chiqmaydi', async () => {
      const a = await createUser(app);
      const b = await createUser(app);
      await createNote(app, b.token, { title: 'secret meeting' });
      const res = await list(a.token, '?search=meeting');
      expect(res.body.data).toEqual([]);
    });
  });

  describe('Filtrlarni birlashtirish', () => {
    it('category + isArchived + search + pagination birga ishlaydi', async () => {
      const user = await createUser(app);
      const work = await createCategory(app, user.token);
      const other = await createCategory(app, user.token);
      const target1 = await createNote(app, user.token, { title: 'Report Q1', categoryId: work.id });
      await createNote(app, user.token, { title: 'Report Q2', categoryId: work.id });
      await createNote(app, user.token, { title: 'Report Q3', categoryId: other.id });
      await createNote(app, user.token, { title: 'Lunch', categoryId: work.id });
      await http().patch(`/notes/${target1.id}/archive`).set(bearer(user.token));

      const res = await list(
        user.token,
        `?categoryId=${work.id}&isArchived=false&search=report&page=1&limit=5`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.map((n: NoteBody) => n.title)).toEqual(['Report Q2']);
      expect(res.body.meta).toEqual({ total: 1, page: 1, limit: 5, totalPages: 1 });
    });

    it('filtr bilan meta.total filtrlangan natijani hisoblaydi (umumiy sonni emas)', async () => {
      const user = await createUser(app);
      const cat = await createCategory(app, user.token);
      for (let i = 0; i < 7; i++) await createNote(app, user.token, { categoryId: cat.id });
      for (let i = 0; i < 4; i++) await createNote(app, user.token);
      const res = await list(user.token, `?categoryId=${cat.id}&limit=5`);
      expect(res.body.meta).toEqual({ total: 7, page: 1, limit: 5, totalPages: 2 });
      expect(res.body.data).toHaveLength(5);
    });
  });
});
