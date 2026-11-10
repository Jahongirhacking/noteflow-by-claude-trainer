import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from '../helpers/app';

describe('[M1] Database ulanishi va dastlabki sozlama', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('test muhiti test database nomini ishlatadi ("_test" bilan tugaydi)', () => {
    expect(process.env.DB_DATABASE).toMatch(/_test$/);
  });

  it('DataSource ulangan (isInitialized)', () => {
    expect(ds.isInitialized).toBe(true);
  });

  it('PostgreSQL ga so`rov yuborish mumkin (SELECT 1)', async () => {
    const rows = await ds.query('SELECT 1 AS ok');
    expect(rows[0].ok).toBe(1);
  });

  it('ilova aynan test database ga ulangan', async () => {
    const rows = await ds.query('SELECT current_database() AS db');
    expect(rows[0].db).toBe(process.env.DB_DATABASE);
  });

  it('synchronize o`chirilgan (faqat migratsiya ishlatiladi)', () => {
    expect((ds.options as { synchronize?: boolean }).synchronize).toBeFalsy();
  });

  it('kamida bitta migratsiya qo`llangan ("migrations" jadvalida yozuv bor)', async () => {
    const rows = await ds.query('SELECT COUNT(*)::int AS c FROM migrations');
    expect(rows[0].c).toBeGreaterThanOrEqual(1);
  });

  it('qo`llanmagan (pending) migratsiya yo`q', async () => {
    await expect(ds.showMigrations()).resolves.toBe(false);
  });

  it('"users" jadvali mavjud va kerakli ustunlarga ega', async () => {
    const rows: Array<{ column_name: string }> = await ds.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`,
    );
    expect(rows.length).toBeGreaterThan(0);
    // "fullName" / "full_name" farqini hisobga olmaymiz.
    const cols = rows.map((r) => r.column_name.replace(/_/g, '').toLowerCase());
    for (const expected of ['id', 'fullname', 'email', 'passwordhash', 'role', 'createdat', 'updatedat']) {
      expect(cols).toContain(expected);
    }
  });
});
