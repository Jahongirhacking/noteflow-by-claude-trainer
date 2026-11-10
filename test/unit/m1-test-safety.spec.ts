import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  assertSafeTestDatabaseName,
  assertSafeTestEnv,
  assertSafeUploadDir,
} from '../setup/safety';

/**
 * Bu test STUDENT KODIGA bog'liq emas — u test infratuzilmasining xavfsizlik tekshiruvlarini sinaydi.
 * Maqsad: testlar tasodifan development database'ga tegib ketmasligi.
 */
describe('[M1] Test database xavfsizlik tekshiruvlari', () => {
  const baseEnv = (over: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
    NODE_ENV: 'test',
    DB_HOST: 'localhost',
    DB_DATABASE: 'noteflow_test',
    UPLOAD_DIR: './uploads-test',
    ...over,
  });

  it('"_test" bilan tugaydigan database nomini qabul qiladi', () => {
    expect(assertSafeTestDatabaseName('noteflow_test')).toBe('noteflow_test');
  });

  it.each(['noteflow_dev', 'noteflow', 'production', 'testdb'])(
    '"%s" database nomini rad etadi',
    (name) => {
      expect(() => assertSafeTestDatabaseName(name)).toThrow(/_test/);
    },
  );

  it("bo'sh database nomini rad etadi", () => {
    expect(() => assertSafeTestDatabaseName(undefined)).toThrow();
  });

  it("NODE_ENV=test bo'lmasa rad etadi", () => {
    expect(() => assertSafeTestEnv(baseEnv({ NODE_ENV: 'development' }), tmpdir())).toThrow(/NODE_ENV/);
  });

  it('lokal bo`lmagan DB_HOST ni rad etadi', () => {
    expect(() => assertSafeTestEnv(baseEnv({ DB_HOST: 'db.prod.example.com' }), tmpdir())).toThrow(/lokal/);
  });

  it('to`g`ri test muhitini qabul qiladi', () => {
    expect(() => assertSafeTestEnv(baseEnv(), mkdtempSync(join(tmpdir(), 'nf-')))).not.toThrow();
  });

  it('development .env dagi database bilan bir xil bo`lsa rad etadi', () => {
    const root = mkdtempSync(join(tmpdir(), 'nf-'));
    writeFileSync(join(root, '.env'), 'DB_DATABASE=noteflow_test\n');
    expect(() => assertSafeTestEnv(baseEnv(), root)).toThrow(/bir xil/);
  });

  it('nomida "test" bo`lmagan UPLOAD_DIR ni rad etadi', () => {
    expect(() => assertSafeUploadDir('./uploads')).toThrow(/test/);
    expect(assertSafeUploadDir('./uploads-test')).toBe('./uploads-test');
  });
});
