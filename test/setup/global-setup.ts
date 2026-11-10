import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import type { DataSource } from 'typeorm';
import { ROOT_DIR, loadTestEnv } from './load-env';
import { assertSafeTestDatabaseName, assertSafeUploadDir } from './safety';

/**
 * Jest `globalSetup`: barcha e2e testlardan oldin BIR marta ishlaydi.
 *  1. .env.test ni yuklaydi va xavfsizlikni tekshiradi.
 *  2. src/database/data-source.ts dagi DataSource orqali test database'ga MIGRATSIYALARNI qo'llaydi
 *     (synchronize ishlatilmaydi!).
 *  3. Test uploads papkasini tozalaydi.
 */
export default async function globalSetup(): Promise<void> {
  loadTestEnv();

  const dataSourcePath = join(ROOT_DIR, 'src', 'database', 'data-source.ts');
  if (!existsSync(dataSourcePath)) {
    throw new Error(
      "src/database/data-source.ts topilmadi. Bu fayl 'export default new DataSource({...})' ni eksport qilishi kerak " +
        "(ASSIGNMENT.md, 8-bo'lim — 1-milestone).",
    );
  }

  // process.env allaqachon .env.test dan to'ldirilgan, shuning uchun data-source.ts test DB'ni o'qiydi.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(dataSourcePath);
  const dataSource: DataSource | undefined = mod.default;
  if (!dataSource || typeof dataSource.initialize !== 'function') {
    throw new Error("data-source.ts 'export default new DataSource(...)' ni eksport qilmagan.");
  }

  // ULANISHDAN OLDIN: DataSource haqiqatan test database'ga qaraganini tekshiramiz.
  assertSafeTestDatabaseName(dataSource.options.database as string | undefined);
  if ((dataSource.options as { synchronize?: boolean }).synchronize === true) {
    throw new Error('synchronize: true taqiqlangan. Faqat migratsiyalardan foydalaning.');
  }

  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
  } catch (err) {
    throw new Error(
      `Test database'ga ulanib/migratsiya qilib bo'lmadi: ${(err as Error).message}\n` +
        `Yordam: ASSIGNMENT.md > "Ulanish xatolarini aniqlash" bo'limi.`,
    );
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }

  const uploadDir = assertSafeUploadDir(process.env.UPLOAD_DIR);
  rmSync(uploadDir, { recursive: true, force: true });
  mkdirSync(uploadDir, { recursive: true });
}
