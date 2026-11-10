import { DataSource } from 'typeorm';
import { assertConnectedToTestDatabase } from '../setup/safety';

/**
 * Barcha jadvallarni bo'shatadi (migratsiya jadvalidan tashqari).
 * Har bir testdan oldin chaqiriladi, shuning uchun testlar bir-biriga bog'liq emas.
 * Avval ulanish test database'ga ekanini tekshiradi — aks holda HECH NARSA o'chirilmaydi.
 */
export async function cleanDatabase(ds: DataSource): Promise<void> {
  await assertConnectedToTestDatabase(ds);
  const migrationsTable = (ds.options.migrationsTableName as string | undefined) ?? 'migrations';
  const rows: Array<{ tablename: string }> = await ds.query(
    `SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT IN ($1, 'typeorm_metadata')`,
    [migrationsTable],
  );
  if (rows.length === 0) return;
  const list = rows.map((r) => `"${r.tablename}"`).join(', ');
  await ds.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
