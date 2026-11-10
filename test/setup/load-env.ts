import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { assertSafeTestEnv } from './safety';

export const ROOT_DIR = resolve(__dirname, '..', '..');

/** .env.test ni yuklaydi (shell'dagi qiymatlarni ham ustidan yozadi) va xavfsizlikni tekshiradi. */
export function loadTestEnv(): void {
  const path = join(ROOT_DIR, '.env.test');
  if (!existsSync(path)) {
    throw new Error(
      ".env.test fayli topilmadi. Yarating:  cp .env.test.example .env.test  (va test database yarating).",
    );
  }
  process.env.NODE_ENV = 'test';
  config({ path, override: true, quiet: true });
  // UPLOAD_DIR ni mutlaq yo'lga aylantiramiz: ilova qaysi papkadan ishga tushganidan qat'i nazar bir xil bo'lsin.
  process.env.UPLOAD_DIR = resolve(ROOT_DIR, process.env.UPLOAD_DIR ?? 'uploads-test');
  assertSafeTestEnv(process.env, ROOT_DIR);
}
