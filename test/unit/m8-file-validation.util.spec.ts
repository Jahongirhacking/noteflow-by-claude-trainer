import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  generateStorageName,
  validateUploadedFile,
} from '../../src/attachments/file-validation.util';

const file = (over: Partial<{ mimetype: string; size: number; originalname: string }> = {}) => ({
  originalname: 'photo.png',
  mimetype: 'image/png',
  size: 1024,
  ...over,
});

describe('[M8] file-validation.util', () => {
  it('limit aynan 5 MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('ruxsat etilgan turlar: png, jpeg, pdf, txt', () => {
    expect([...ALLOWED_MIME_TYPES].sort()).toEqual(
      ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'].sort(),
    );
  });

  describe('validateUploadedFile', () => {
    it("to'g'ri faylda xato bermaydi", () => {
      expect(() => validateUploadedFile(file())).not.toThrow();
    });

    it('chegaradagi (aynan 5 MB) faylni qabul qiladi', () => {
      expect(() => validateUploadedFile(file({ size: MAX_FILE_SIZE_BYTES }))).not.toThrow();
    });

    it('fayl yo`q (undefined) bo`lsa — 400 BadRequest', () => {
      expect(() => validateUploadedFile(undefined)).toThrow(BadRequestException);
    });

    it('ruxsat etilmagan tur — 415 UnsupportedMediaType', () => {
      expect(() => validateUploadedFile(file({ mimetype: 'application/x-msdownload' }))).toThrow(
        UnsupportedMediaTypeException,
      );
    });

    it('5 MB dan katta — 413 PayloadTooLarge', () => {
      expect(() => validateUploadedFile(file({ size: MAX_FILE_SIZE_BYTES + 1 }))).toThrow(
        PayloadTooLargeException,
      );
    });
  });

  describe('generateStorageName', () => {
    it('har chaqiriqda noyob nom beradi', () => {
      expect(generateStorageName('a.png')).not.toBe(generateStorageName('a.png'));
    });

    it('xavfli asl nomdan foydalanmaydi: "/" , ".." yo`q, asl nom qismi yo`q', () => {
      const name = generateStorageName('../../etc/passwd.png');
      expect(name).not.toContain('/');
      expect(name).not.toContain('\\');
      expect(name).not.toContain('..');
      expect(name).not.toContain('passwd');
    });

    it('kengaytmani saqlaydi (kichik harfda)', () => {
      expect(generateStorageName('Report.PDF')).toMatch(/\.pdf$/);
    });
  });
});
