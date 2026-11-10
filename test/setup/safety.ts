import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { parse } from 'dotenv';
import type { DataSource } from 'typeorm';

/**
 * XAVFSIZLIK QATLAMI.
 * E2E testlar jadvallarni TRUNCATE qiladi va fayllarni o'chiradi.
 * Bu funksiyalar testlar HECH QACHON development/production database'ga tegmasligini kafolatlaydi.
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

export function assertSafeTestDatabaseName(name: string | undefined): string {
  if (!name) {
    throw new Error(
      "DB_DATABASE aniqlanmagan. .env.test faylida DB_DATABASE=noteflow_test deb yozing.",
    );
  }
  if (!name.endsWith('_test')) {
    throw new Error(
      `XAVFSIZLIK: test database nomi "_test" bilan tugashi shart, lekin "${name}" berilgan. ` +
        `Testlar ma'lumotlarni o'chiradi — shuning uchun ishga tushirish rad etildi. ` +
        `.env.test faylida DB_DATABASE=noteflow_test deb yozing.`,
    );
  }
  return name;
}

export function assertSafeUploadDir(dir: string | undefined): string {
  if (!dir) throw new Error('UPLOAD_DIR aniqlanmagan (.env.test ichida UPLOAD_DIR=./uploads-test).');
  if (!basename(dir.replace(/[\\/]+$/, '')).toLowerCase().includes('test')) {
    throw new Error(
      `XAVFSIZLIK: test UPLOAD_DIR nomida "test" so'zi bo'lishi shart ("${dir}" berilgan). ` +
        `Aks holda testlar haqiqiy uploads papkasini tozalab yuborishi mumkin.`,
    );
  }
  return dir;
}

export function assertSafeTestEnv(
  env: NodeJS.ProcessEnv = process.env,
  rootDir: string = process.cwd(),
): void {
  if (env.NODE_ENV !== 'test') {
    throw new Error(`NODE_ENV="test" bo'lishi shart, lekin "${env.NODE_ENV}" topildi.`);
  }
  const testDb = assertSafeTestDatabaseName(env.DB_DATABASE);

  const host = env.DB_HOST ?? 'localhost';
  if (!LOCAL_HOSTS.includes(host) && env.ALLOW_REMOTE_TEST_DB !== 'true') {
    throw new Error(
      `XAVFSIZLIK: test DB_HOST lokal bo'lishi kerak (localhost/127.0.0.1), "${host}" berilgan.`,
    );
  }

  // Development .env bilan to'qnashuv bo'lmasin.
  const devEnvPath = join(rootDir, '.env');
  if (existsSync(devEnvPath)) {
    const devDb = parse(readFileSync(devEnvPath)).DB_DATABASE;
    if (devDb && devDb === testDb) {
      throw new Error(
        `XAVFSIZLIK: test database ("${testDb}") development database bilan bir xil. Ular ALOHIDA bo'lishi shart.`,
      );
    }
  }
  assertSafeUploadDir(env.UPLOAD_DIR);
}

/** Haqiqiy ulanishdan keyin: server aynan test database'ga ulanganini tekshiradi. */
export async function assertConnectedToTestDatabase(ds: DataSource): Promise<string> {
  const rows: Array<{ db: string }> = await ds.query('SELECT current_database() AS db');
  const name = rows[0]?.db;
  assertSafeTestDatabaseName(name);
  if (name !== process.env.DB_DATABASE) {
    throw new Error(`Kutilgan database "${process.env.DB_DATABASE}", lekin ulangan: "${name}".`);
  }
  return name;
}
