import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';
import { bearer, createAdmin, createUser, TestUser } from '../helpers/auth';
import { cleanDatabase } from '../helpers/db';
import { createNote } from '../helpers/factories';
import {
  bufferOfSize,
  cleanUploadDir,
  listUploadedFiles,
  MAX_BYTES,
  pdfBuffer,
  pngBuffer,
  textBuffer,
} from '../helpers/files';

describe('[M8] Fayl yuklash va attachment lar', () => {
  let app: INestApplication;
  let ds: DataSource;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await cleanDatabase(ds);
    cleanUploadDir();
  });
  afterAll(async () => {
    cleanUploadDir();
    await app?.close();
  });

  const attachmentCount = async () => (await ds.query('SELECT COUNT(*)::int AS c FROM attachments'))[0].c as number;

  const upload = (
    token: string | null,
    noteId: string,
    file: Buffer,
    filename = 'photo.png',
    contentType = 'image/png',
  ) => {
    const req = http().post(`/notes/${noteId}/attachments`);
    if (token) req.set(bearer(token));
    return req.attach('file', file, { filename, contentType });
  };

  async function userWithNote(): Promise<{ user: TestUser; noteId: string }> {
    const user = await createUser(app);
    const note = await createNote(app, user.token);
    return { user, noteId: note.id };
  }

  describe('POST /notes/:noteId/attachments', () => {
    it('PNG yuklaydi: 201 va metadata (serverdagi yo`l ko`rsatilmaydi)', async () => {
      const { user, noteId } = await userWithNote();
      const png = pngBuffer();
      const res = await upload(user.token, noteId, png);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        originalName: 'photo.png',
        mimeType: 'image/png',
        size: png.length,
        noteId,
      });
      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toBeDefined();

      // Ichki ma'lumotlar sizib chiqmasligi kerak.
      expect(res.body).not.toHaveProperty('storageName');
      expect(res.body).not.toHaveProperty('path');
      expect(res.body).not.toHaveProperty('destination');
      const text = JSON.stringify(res.body);
      expect(text).not.toContain(process.env.UPLOAD_DIR as string);
      expect(text.toLowerCase()).not.toMatch(/uploads|\/home\/|[a-z]:\\\\/);
    });

    it('fayl diskda saqlanadi, nomi originalidan farq qiladi, mazmuni o`zgarmaydi', async () => {
      const { user, noteId } = await userWithNote();
      const png = pngBuffer();
      await upload(user.token, noteId, png, 'photo.png');

      const files = listUploadedFiles();
      expect(files).toHaveLength(1);
      expect(files[0].toLowerCase()).not.toContain('photo');
      expect(readFileSync(files[0]).equals(png)).toBe(true);
    });

    it('metadata PostgreSQL ga yoziladi', async () => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, pngBuffer());
      const rows = await ds.query('SELECT * FROM attachments WHERE id = $1', [res.body.id]);
      expect(rows).toHaveLength(1);
    });

    it.each([
      ['image/jpeg', 'rasm.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10])],
      ['application/pdf', 'hujjat.pdf', pdfBuffer()],
      ['text/plain', 'matn.txt', textBuffer()],
    ])('%s turidagi (%s) faylni qabul qiladi', async (mime, name, buf) => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, buf, name, mime);
      expect(res.status).toBe(201);
      expect(res.body.mimeType).toBe(mime);
    });

    it('bir xil nomli ikkita fayl bir-birini ustiga yozmaydi (noyob storage nomi)', async () => {
      const { user, noteId } = await userWithNote();
      const r1 = await upload(user.token, noteId, pngBuffer(), 'same.png');
      const r2 = await upload(user.token, noteId, pngBuffer(), 'same.png');
      expect(r1.status).toBe(201);
      expect(r2.status).toBe(201);
      expect(r1.body.id).not.toBe(r2.body.id);
      expect(listUploadedFiles()).toHaveLength(2);
    });

    it('xavfli original nom ("../../x.png") storage yo`liga ta`sir qilmaydi', async () => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, pngBuffer(), '../../evil.png');
      expect(res.status).toBe(201);
      const files = listUploadedFiles();
      expect(files).toHaveLength(1);
      expect(files[0].startsWith(process.env.UPLOAD_DIR as string)).toBe(true);
      expect(files[0]).not.toContain('evil');
    });

    it('ruxsat etilmagan tur (.exe): 415 va hech narsa saqlanmaydi', async () => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, Buffer.from('MZ-fake'), 'virus.exe', 'application/x-msdownload');
      expect(res.status).toBe(415);
      expect(res.body.statusCode).toBe(415);
      expect(listUploadedFiles()).toHaveLength(0);
      expect(await attachmentCount()).toBe(0);
    });

    it('text/html ham ruxsat etilmagan: 415', async () => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, Buffer.from('<script>1</script>'), 'x.html', 'text/html');
      expect(res.status).toBe(415);
    });

    it('5 MB dan katta fayl: 413 va hech narsa saqlanmaydi', async () => {
      const { user, noteId } = await userWithNote();
      const res = await upload(user.token, noteId, bufferOfSize(MAX_BYTES + 1), 'big.png');
      expect(res.status).toBe(413);
      expect(res.body.statusCode).toBe(413);
      expect(listUploadedFiles()).toHaveLength(0);
      expect(await attachmentCount()).toBe(0);
    });

    it('fayl yuborilmasa: 400', async () => {
      const { user, noteId } = await userWithNote();
      const res = await http()
        .post(`/notes/${noteId}/attachments`)
        .set(bearer(user.token))
        .field('description', 'faylsiz');
      expect(res.status).toBe(400);
    });

    it('fayl noto`g`ri maydon nomi bilan yuborilsa ("document", "file" emas): 400', async () => {
      const { user, noteId } = await userWithNote();
      const res = await http()
        .post(`/notes/${noteId}/attachments`)
        .set(bearer(user.token))
        .attach('document', pngBuffer(), { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(400);
      expect(listUploadedFiles()).toHaveLength(0);
    });

    it('multipart emas (oddiy JSON) yuborilsa: 400', async () => {
      const { user, noteId } = await userWithNote();
      const res = await http()
        .post(`/notes/${noteId}/attachments`)
        .set(bearer(user.token))
        .send({ file: 'bu fayl emas' });
      expect(res.status).toBe(400);
    });

    it('JWT siz: 401 va hech narsa saqlanmaydi', async () => {
      const { noteId } = await userWithNote();
      const res = await upload(null, noteId, pngBuffer());
      expect(res.status).toBe(401);
      expect(listUploadedFiles()).toHaveLength(0);
    });

    it('boshqa userning note iga yuklab bo`lmaydi: 404 va hech narsa saqlanmaydi', async () => {
      const { noteId } = await userWithNote();
      const stranger = await createUser(app);
      const res = await upload(stranger.token, noteId, pngBuffer());
      expect(res.status).toBe(404);
      expect(listUploadedFiles()).toHaveLength(0);
      expect(await attachmentCount()).toBe(0);
    });

    it('mavjud bo`lmagan note: 404; UUID emas: 400', async () => {
      const user = await createUser(app);
      expect((await upload(user.token, randomUUID(), pngBuffer())).status).toBe(404);
      expect((await upload(user.token, 'abc', pngBuffer())).status).toBe(400);
      expect(listUploadedFiles()).toHaveLength(0);
    });

    it('saqlashda xato bo`lsa (papka yozib bo`lmaydigan): 500, umumiy xabar, yo`l sizmaydi, DB da yozuv qolmaydi', async () => {
      const { user, noteId } = await userWithNote();
      const dir = process.env.UPLOAD_DIR as string;
      // Papkani oddiy FAYL bilan almashtiramiz — unga fayl yozib bo'lmaydi.
      rmSync(dir, { recursive: true, force: true });
      writeFileSync(dir, 'bu papka emas');
      try {
        const res = await upload(user.token, noteId, pngBuffer());
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain(dir);
        expect(res.body).not.toHaveProperty('stack');
        expect(await attachmentCount()).toBe(0);
      } finally {
        rmSync(dir, { force: true });
        mkdirSync(dir, { recursive: true });
      }
    });
  });

  describe('GET /attachments/:id (yuklab olish)', () => {
    it('egasi faylni yuklab oladi: 200, to`g`ri Content-Type, asl nom, bir xil baytlar', async () => {
      const { user, noteId } = await userWithNote();
      const png = pngBuffer();
      const up = await upload(user.token, noteId, png, 'photo.png');

      const res = await http()
        .get(`/attachments/${up.body.id}`)
        .set(bearer(user.token))
        .responseType('blob');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^image\/png/);
      expect(res.headers['content-disposition']).toMatch(/photo\.png/);
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect((res.body as Buffer).equals(png)).toBe(true);
    });

    it('JWT siz: 401', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      expect((await http().get(`/attachments/${up.body.id}`)).status).toBe(401);
    });

    it('boshqa user: 404 (fayl mavjudligi sezdirilmaydi)', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      const stranger = await createUser(app);
      const res = await http().get(`/attachments/${up.body.id}`).set(bearer(stranger.token));
      expect(res.status).toBe(404);
    });

    it('ADMIN ham boshqa userning faylini ko`ra olmaydi: 404', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      const admin = await createAdmin(app);
      const res = await http().get(`/attachments/${up.body.id}`).set(bearer(admin.token));
      expect(res.status).toBe(404);
    });

    it('mavjud bo`lmagan id: 404; UUID emas: 400', async () => {
      const user = await createUser(app);
      expect((await http().get(`/attachments/${randomUUID()}`).set(bearer(user.token))).status).toBe(404);
      expect((await http().get('/attachments/abc').set(bearer(user.token))).status).toBe(400);
    });
  });

  describe('DELETE /attachments/:id', () => {
    it('egasi o`chiradi: 204, DB yozuvi va FIZIK fayl ham o`chadi', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      const [file] = listUploadedFiles();
      expect(existsSync(file)).toBe(true);

      const del = await http().delete(`/attachments/${up.body.id}`).set(bearer(user.token));
      expect(del.status).toBe(204);

      expect(existsSync(file)).toBe(false);
      expect(listUploadedFiles()).toHaveLength(0);
      expect(await attachmentCount()).toBe(0);
      expect((await http().get(`/attachments/${up.body.id}`).set(bearer(user.token))).status).toBe(404);
    });

    it('boshqa user o`chira olmaydi: 404, fayl va yozuv saqlanadi', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      const stranger = await createUser(app);

      const del = await http().delete(`/attachments/${up.body.id}`).set(bearer(stranger.token));
      expect(del.status).toBe(404);
      expect(listUploadedFiles()).toHaveLength(1);
      expect(await attachmentCount()).toBe(1);
    });

    it('JWT siz: 401', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      expect((await http().delete(`/attachments/${up.body.id}`)).status).toBe(401);
      expect(listUploadedFiles()).toHaveLength(1);
    });

    it('mavjud bo`lmagan id: 404', async () => {
      const user = await createUser(app);
      expect((await http().delete(`/attachments/${randomUUID()}`).set(bearer(user.token))).status).toBe(404);
    });

    it('fizik fayl allaqachon yo`q bo`lsa ham o`chirish xatosiz tugaydi (204)', async () => {
      const { user, noteId } = await userWithNote();
      const up = await upload(user.token, noteId, pngBuffer());
      cleanUploadDir(); // faylni qo'lda yo'qotamiz
      const del = await http().delete(`/attachments/${up.body.id}`).set(bearer(user.token));
      expect(del.status).toBe(204);
      expect(await attachmentCount()).toBe(0);
    });
  });

  describe('Note o`chirilganda (★ qiyinroq)', () => {
    it('note o`chirilsa, uning attachment yozuvlari VA fizik fayllari ham o`chadi', async () => {
      const { user, noteId } = await userWithNote();
      await upload(user.token, noteId, pngBuffer(), 'a.png');
      await upload(user.token, noteId, pdfBuffer(), 'b.pdf', 'application/pdf');
      expect(listUploadedFiles()).toHaveLength(2);

      const del = await http().delete(`/notes/${noteId}`).set(bearer(user.token));
      expect(del.status).toBe(204);

      expect(await attachmentCount()).toBe(0);
      expect(listUploadedFiles()).toHaveLength(0);
    });
  });
});
