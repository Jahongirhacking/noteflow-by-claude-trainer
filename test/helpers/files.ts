import { readdirSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { assertSafeUploadDir } from '../setup/safety';

export const MAX_BYTES = 5 * 1024 * 1024;

/** Kichkina haqiqiy PNG (1x1 piksel). */
export function pngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

export function pdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
}

export function textBuffer(text = 'salom, NoteFlow'): Buffer {
  return Buffer.from(text, 'utf8');
}

/** `bytes` bayt hajmli fayl (limitni tekshirish uchun). */
export function bufferOfSize(bytes: number): Buffer {
  return Buffer.alloc(bytes, 'a');
}

function uploadDir(): string {
  return assertSafeUploadDir(process.env.UPLOAD_DIR);
}

/** Test uploads papkasidagi barcha fayllarning ro'yxati (rekursiv). */
export function listUploadedFiles(dir: string = uploadDir()): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listUploadedFiles(full));
    else if (entry.name !== '.gitkeep') out.push(full);
  }
  return out;
}

/** Faqat TEST uploads papkasini bo'shatadi (nomida "test" bo'lmasa — rad etadi). */
export function cleanUploadDir(): void {
  const dir = uploadDir();
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
